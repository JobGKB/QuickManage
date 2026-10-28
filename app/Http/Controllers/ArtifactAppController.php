<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ArtifactApps\ArtifactPageBuilder;
use App\Services\ArtifactApps\DocumentNotFoundException;
use App\Services\ArtifactApps\JsonDocumentStore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use stdClass;

/**
 * Hosts Claude artifact apps (config/artifact_apps.php) inside QuickManage.
 *
 * The page is assembled from resources/apps/<slug>/src and gets
 * public/js/artifact-apps/claude-runtime.js, which implements window.claude
 * on top of the JSON endpoints below. Storage is a local JSON file per app
 * (JsonDocumentStore); nothing is written to MySQL.
 */
class ArtifactAppController extends Controller
{
    private const USER_PREFIX = 'qm-';

    private const SSO_PREFIX = 'sso-';

    private const ASSET_TYPES = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
        'application/pdf' => 'pdf',
    ];

    public function show(Request $request)
    {
        [$slug, $cfg] = $this->app($request);
        $base = rtrim((string) parse_url(url($slug), PHP_URL_PATH), '/');

        // Claude serves uploaded assets at "/_blob/<id>"; here they live under "/<slug>/_blob/<id>".
        $page = str_replace("'/_blob/'", "'{$base}/_blob/'", ArtifactPageBuilder::build($cfg['layout'], $cfg['source']));

        return view('artifact-apps.show', [
            'page' => $page,
            'runtimeConfig' => [
                'app' => $slug,
                'api' => url($slug . '/api'),
                'pollInterval' => (int) config('artifact_apps.poll_interval_ms', 15000),
                'capabilities' => array_values($cfg['capabilities'] ?? []),
                'user' => $this->currentProfile($request),
            ],
        ]);
    }

    /**
     * GET api/snapshot?c[]=<collection>&d[]=<collection>/<id>&since=<version>
     * Returns only the requested collections/documents, or {unchanged: true}
     * when nothing in the store changed since `since`.
     */
    public function snapshot(Request $request): JsonResponse
    {
        [$version, $documents] = $this->store($request)->read();
        $version = (string) $version;

        if ($request->query('since') === $version) {
            return response()->json(['version' => $version, 'unchanged' => true]);
        }

        $wanted = array_fill_keys($this->strings($request->query('c')), true);
        $collections = new stdClass();
        foreach (array_keys($wanted) as $name) {
            $collections->{$name} = new stdClass();
        }
        foreach ($documents as $path => $data) {
            [$collection, $id] = JsonDocumentStore::splitPath($path) ?? [null, null];
            if ($collection !== null && isset($wanted[$collection])) {
                $collections->{$collection}->{$id} = $data;
            }
        }

        $docs = new stdClass();
        foreach ($this->strings($request->query('d')) as $path) {
            $docs->{$path} = $documents->{$path} ?? null;
        }

        return response()->json(['version' => $version, 'collections' => $collections, 'docs' => $docs]);
    }

    /**
     * GET api/query?collection=<name>&where=[["field","==",value], ...]
     */
    public function query(Request $request): JsonResponse
    {
        $collection = (string) $request->query('collection', '');
        $where = json_decode((string) $request->query('where', '[]'), false);

        if (! JsonDocumentStore::splitPath($collection . '/x') || ! is_array($where)) {
            return $this->error('invalid_argument', 'Ongeldige query.', 422);
        }
        foreach ($where as $filter) {
            if (! is_array($filter) || count($filter) !== 3 || ! is_string($filter[0]) || ! in_array($filter[1], ['==', '!='], true)) {
                return $this->error('unimplemented', 'Alleen filters met == en != worden ondersteund.', 422);
            }
        }

        [$version, $documents] = $this->store($request)->read();
        $result = new stdClass();
        foreach ($documents as $path => $data) {
            [$c, $id] = JsonDocumentStore::splitPath($path) ?? [null, null];
            if ($c !== $collection) {
                continue;
            }
            foreach ($where as [$field, $op, $value]) {
                $equal = ($data->{$field} ?? null) == $value && gettype($data->{$field} ?? null) === gettype($value);
                if ($equal !== ($op === '==')) {
                    continue 2;
                }
            }
            $result->{$id} = $data;
        }

        return response()->json(['version' => (string) $version, 'docs' => $result]);
    }

    /**
     * POST api/write  {"op": "set" | "update" | "delete", "path": "<collection>/<id>", "data": {...}}
     */
    public function write(Request $request): JsonResponse
    {
        $body = json_decode($request->getContent(), false);
        $op = $body->op ?? null;
        $path = $body->path ?? null;
        $data = $body->data ?? null;

        if (! in_array($op, ['set', 'update', 'delete'], true) || ! is_string($path) || ! JsonDocumentStore::splitPath($path)) {
            return $this->error('invalid_argument', 'Ongeldige opdracht.', 422);
        }
        if ($op !== 'delete' && ! $data instanceof stdClass) {
            return $this->error('invalid_argument', 'Gegevens ontbreken of zijn geen object.', 422);
        }

        try {
            $version = $this->store($request)->write($op, $path, $op === 'delete' ? null : $data);
        } catch (DocumentNotFoundException $e) {
            return $this->error('not_found', $e->getMessage(), 404);
        }

        return response()->json(['ok' => true, 'version' => (string) $version]);
    }

    /**
     * POST api/profiles {"ids": ["qm-<uniqid>", "sso-<azure id>", ...]} -> {"<id>": {id, name, avatarUrl}}
     */
    public function profiles(Request $request): JsonResponse
    {
        $uniqids = [];
        $ssoIds = [];
        foreach ($this->strings($request->input('ids')) as $id) {
            if (str_starts_with($id, self::USER_PREFIX)) {
                $uniqids[] = substr($id, strlen(self::USER_PREFIX));
            } elseif (str_starts_with($id, self::SSO_PREFIX)) {
                $ssoIds[] = substr($id, strlen(self::SSO_PREFIX));
            }
        }

        $result = new stdClass();
        if ($uniqids) {
            foreach (User::query()->whereIn('uniqid', $uniqids)->get() as $user) {
                $profile = $this->profile($user);
                $result->{$profile['id']} = $profile;
            }
        }
        if ($ssoIds) {
            [, $known] = $this->ssoUsers()->read();
            foreach ($ssoIds as $ssoId) {
                if ($u = $known->{"users/{$ssoId}"} ?? null) {
                    $result->{self::SSO_PREFIX . $ssoId} = ['id' => self::SSO_PREFIX . $ssoId, 'name' => $u->name ?? '', 'avatarUrl' => ''];
                }
            }
        }

        return response()->json($result);
    }

    /**
     * POST api/assets (multipart: file, type) -> {id, url}
     */
    public function uploadAsset(Request $request): JsonResponse
    {
        [$slug, $cfg] = $this->app($request);
        if (! in_array('assets', $cfg['capabilities'] ?? [], true)) {
            return $this->error('permission_denied', 'Uploaden is voor deze app niet ingeschakeld.', 403);
        }

        $file = $request->file('file');
        if (! $file || ! $file->isValid()) {
            return $this->error('invalid_argument', 'Geen (geldig) bestand ontvangen.', 422);
        }
        if ($file->getSize() > (int) config('artifact_apps.max_asset_kb') * 1024) {
            return $this->error('resource_exhausted', 'Bestand is te groot.', 413);
        }

        $type = (string) ($request->input('type') ?: $file->getMimeType());
        $ext = self::ASSET_TYPES[$type] ?? null;
        if (! $ext) {
            return $this->error('invalid_argument', "Bestandstype {$type} wordt niet ondersteund.", 422);
        }

        $id = bin2hex(random_bytes(16));
        $file->move($this->assetDir($slug), "{$id}.{$ext}");

        return response()->json(['id' => $id, 'url' => url("{$slug}/_blob/{$id}")]);
    }

    /**
     * GET _blob/{asset}
     */
    public function asset(Request $request)
    {
        [$slug] = $this->app($request);
        $id = (string) $request->route('asset');
        $matches = preg_match('/^[a-f0-9]{32}$/', $id) ? glob($this->assetDir($slug) . DIRECTORY_SEPARATOR . $id . '.*') : [];
        $file = $matches[0] ?? null;
        abort_unless($file && is_file($file), 404);

        $type = array_search(pathinfo($file, PATHINFO_EXTENSION), self::ASSET_TYPES, true) ?: 'application/octet-stream';

        // Asset ids are random and never reused, so the content never changes.
        return response()->file($file, ['Content-Type' => $type, 'Cache-Control' => 'private, max-age=31536000, immutable']);
    }

    /**
     * @return array{0: string, 1: array}
     */
    private function app(Request $request): array
    {
        $slug = (string) $request->route('app');
        $cfg = config("artifact_apps.apps.{$slug}");
        abort_unless(is_array($cfg), 404);

        return [$slug, $cfg];
    }

    private function store(Request $request): JsonDocumentStore
    {
        [$slug] = $this->app($request);

        return new JsonDocumentStore($slug, $this->appDir($slug));
    }

    private function appDir(string $slug): string
    {
        return rtrim(config('artifact_apps.storage_path'), '\\/') . DIRECTORY_SEPARATOR . $slug;
    }

    private function assetDir(string $slug): string
    {
        return $this->appDir($slug) . DIRECTORY_SEPARATOR . 'assets';
    }

    private function profile(User $user): array
    {
        return [
            'id' => self::USER_PREFIX . $user->uniqid,
            'name' => $user->name,
            'avatarUrl' => $user->image ? asset('storage/profile_images/' . $user->image) : '',
        ];
    }

    /**
     * The visitor is either a QuickManage user (normal login) or a Microsoft SSO
     * user (session "azure.user", see RequireAzureLogin). SSO users are not in the
     * users table; their name is remembered in a JSON file so profiles() can show it.
     */
    private function currentProfile(Request $request): array
    {
        if ($user = Auth::user()) {
            return $this->profile($user);
        }

        $azure = (array) $request->session()->get('azure.user', []);
        $key = (string) (($azure['id'] ?? '') ?: ($azure['email'] ?? ''));
        $name = (string) (($azure['name'] ?? '') ?: ($azure['email'] ?? ''));
        if ($key === '' || ! JsonDocumentStore::splitPath("users/{$key}")) {
            return ['id' => 'sso-onbekend', 'name' => $name, 'avatarUrl' => ''];
        }

        $store = $this->ssoUsers();
        [, $known] = $store->read();
        $current = $known->{"users/{$key}"} ?? null;
        if (($current->name ?? null) !== $name || ($current->email ?? null) !== ($azure['email'] ?? null)) {
            $store->write('set', "users/{$key}", (object) ['name' => $name, 'email' => $azure['email'] ?? null]);
        }

        return ['id' => self::SSO_PREFIX . $key, 'name' => $name, 'avatarUrl' => ''];
    }

    private function ssoUsers(): JsonDocumentStore
    {
        return new JsonDocumentStore('sso-users', $this->appDir('_sso-users'));
    }

    private function strings(mixed $value): array
    {
        return array_values(array_filter((array) ($value ?? []), 'is_string'));
    }

    private function error(string $code, string $message, int $status): JsonResponse
    {
        return response()->json(['code' => $code, 'message' => $message], $status);
    }
}

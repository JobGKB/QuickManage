<?php

namespace App\Http\Controllers;

use App\Models\App;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Server-side proxy for FME Cloud calls.
 *
 * The per-app workspace token is stored encrypted on the App model and is
 * decrypted here only. It is NEVER sent to the browser. All FME target
 * details (repository, workspace, service) are read from the database, so the
 * client cannot point our token at an arbitrary workspace (SSRF/tamper guard).
 */
class FmeProxyController extends Controller
{
    private function baseUrl(): string
    {
        return rtrim((string) config('services.fme.base_url'), '/');
    }

    /**
     * FME workspace items are always `.fmw` files; ensure the extension is present.
     */
    private function workspaceName(App $app): string
    {
        return preg_match('/\.fmw$/i', $app->workspace) ? $app->workspace : $app->workspace . '.fmw';
    }

    /**
     * Resolve the app by its public hash id and return [App, decryptedToken].
     */
    private function resolve(string $unique): array
    {
        $app = App::where('hash_id', $unique)->firstOrFail();

        try {
            $token = Crypt::decryptString($app->wsp_token);
        } catch (DecryptException $e) {
            abort(500, 'Er is een fout opgetreden bij het laden van een onjuiste FME token.');
        }

        return [$app, $token];
    }

    /**
     * GET workspace parameters used to build the form.
     */
    public function parameters(string $unique)
    {
        [$app, $token] = $this->resolve($unique);

        $response = Http::withHeaders([
            'Authorization' => 'fmetoken token=' . $token,
            'Accept'        => 'application/json',
        ])->get(sprintf(
            '%s/fmeapiv4/workspaces/%s/%s/parameters',
            $this->baseUrl(),
            rawurlencode($app->repository),
            rawurlencode($this->workspaceName($app))
        ));

        if (!$response->successful()) {
            return response($response->body(), $response->status())
                ->header('Content-Type', $response->header('Content-Type') ?: 'application/json');
        }

        // The dedicated endpoint returns a bare array; wrap it so the form builder can read `.parameters`.
        return response()->json(['parameters' => $response->json()]);
    }

    /**
     * List available services for a workspace (used by the edit page).
     */
    public function services(string $unique)
    {
        [$app, $token] = $this->resolve($unique);

        $response = Http::withHeaders([
            'Authorization' => 'fmetoken token=' . $token,
            'Accept'        => 'application/json',
        ])->get(sprintf(
            '%s/fmeapiv4/workspaces/%s/%s/services',
            $this->baseUrl(),
            rawurlencode($app->repository),
            rawurlencode($this->workspaceName($app))
        ));

        if (!$response->successful()) {
            return response($response->body(), $response->status())
                ->header('Content-Type', $response->header('Content-Type') ?: 'application/json');
        }

        // V4 returns a keyed object of services; flatten to the [{name}] list the edit page expects.
        $registered = [];
        foreach ((array) $response->json() as $name => $config) {
            if (is_array($config) && ($config['registered'] ?? false)) {
                $registered[] = ['name' => $name];
            }
        }

        return response()->json($registered);
    }

    /**
     * Upload user files to the FME temp shared resource.
     */
    public function upload(string $unique, Request $request)
    {
        [, $token] = $this->resolve($unique);

        $request->validate([
            'files'   => 'required',
            'files.*' => 'file|max:512000', // 500 MB per file
        ]);

        $http = Http::withHeaders([
            'Authorization' => 'fmetoken token=' . $token,
            'Accept'        => 'application/json',
        ]);

        foreach ($request->file('files', []) as $file) {
            $http = $http->attach(
                'files',
                file_get_contents($file->getRealPath()),
                $file->getClientOriginalName()
            );
        }

        // 'path' is a required query parameter; empty uploads to the connection root.
        $response = $http->post(
            $this->baseUrl() . '/fmeapiv4/resources/connections/FME_SHAREDRESOURCE_TEMP/upload?path=&overwrite=true'
        );

        return response($response->body(), $response->status())
            ->header('Content-Type', $response->header('Content-Type') ?: 'application/json');
    }

    /**
     * Run the workspace. Branches on the app's configured service type.
     */
    public function run(string $unique, Request $request)
    {
        [$app, $token] = $this->resolve($unique);

        $parameters = $request->input('parameters', []);
        if (!is_array($parameters)) {
            $parameters = [];
        }

        return match ($app->service) {
            'fmedatastreaming' => $this->runDataStreaming($app, $token, $parameters),
            'fmejobsubmitter'  => $this->runJobSubmitter($app, $token, $parameters),
            default            => response()->json(
                ['message' => 'Niet-ondersteunde service: ' . $app->service],
                422
            ),
        };
    }

    /**
     * fmejobsubmitter: synchronous job run, returns JSON.
     */
    private function runJobSubmitter(App $app, string $token, array $parameters)
    {
        $response = Http::withHeaders([
            'Authorization' => 'fmetoken token=' . $token,
            'Content-Type'  => 'application/json',
            'Accept'        => 'application/json',
        ])->post($this->baseUrl() . '/fmeapiv4/jobs/sync', [
            'repository'          => $app->repository,
            'workspace'           => $this->workspaceName($app),
            'publishedParameters' => (object) $parameters,
        ]);

        return response($response->body(), $response->status())
            ->header('Content-Type', $response->header('Content-Type') ?: 'application/json');
    }

    /**
     * fmedatastreaming: streams the response (HTML for iframe or a file download)
     * straight back to the client without buffering the whole payload in memory.
     */
    private function runDataStreaming(App $app, string $token, array $parameters): StreamedResponse
    {
        $query = $parameters;
        $query['opt_responseformat'] = 'json';
        $query['token'] = $token;

        $url = sprintf(
            '%s/fmedatastreaming/%s/%s',
            $this->baseUrl(),
            rawurlencode($app->repository),
            rawurlencode($this->workspaceName($app))
        );

        $upstream = Http::withOptions(['stream' => true])->get($url, $query);

        $psr = $upstream->toPsrResponse();
        $body = $psr->getBody();

        $headers = ['Content-Type' => $upstream->header('Content-Type') ?: 'application/octet-stream'];
        if ($disposition = $upstream->header('Content-Disposition')) {
            $headers['Content-Disposition'] = $disposition;
        }

        return response()->stream(function () use ($body) {
            while (!$body->eof()) {
                echo $body->read(8192);
                flush();
            }
        }, $upstream->status(), $headers);
    }
}

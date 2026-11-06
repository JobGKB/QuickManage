<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

/**
 * Ontvangstloket IW: upload a supplier file to FME, run the first workspace,
 * then submit the filled-in form to the workspace FME returned as submitTarget.
 *
 * All FME calls go through here so FME_SERVER_TOKEN never reaches the browser.
 * The FME targets come from app_settings.json or from FME's own response (kept in
 * the session), never from the client, so the token cannot be aimed elsewhere.
 */
class Ontvangstloket_IWController extends Controller
{
    private const TEMP_CONNECTION = 'FME_SHAREDRESOURCE_TEMP';

    public function index()
    {
        return view('ontvangstloket_iw.index', [
            'data' => $this->settings(),
        ]);
    }

    /**
     * STEP 1: upload the source file to the FME TEMP shared resource.
     */
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|extensions:csv,xlsx|max:512000', // 500 MB
        ]);

        $file = $request->file('file');
        // Keep the name safe for use inside the FME SOURCE_FILE path (no macros such as "$(...)" or slashes).
        $name = preg_replace('/[^\p{L}\p{N} ._()-]/u', '_', basename($file->getClientOriginalName()));

        $response = Http::withHeaders([
            'Authorization' => 'fmetoken token=' . $this->token(),
            'Accept'        => 'application/json',
        ])->attach('files', fopen($file->getRealPath(), 'r'), $name)
            ->post($this->baseUrl() . '/fmeapiv4/resources/connections/' . self::TEMP_CONNECTION . '/upload?path=&overwrite=true');

        if ($response->successful()) {
            $request->session()->put('ontvangstloket.source_file', $name);
        }

        return $this->forward($response);
    }

    /**
     * STEP 2: run the workspace from app_settings.json on the uploaded file.
     */
    public function run(Request $request)
    {
        $request->validate([
            'init_json' => 'required|string|max:100000',
        ]);

        $sourceFile = $request->session()->get('ontvangstloket.source_file');
        if (! $sourceFile) {
            return response()->json(['message' => 'Upload eerst een bestand.'], 422);
        }

        $target = $this->settings()['submitTarget'] ?? [];

        $response = Http::asForm()->withHeaders(['Accept' => 'application/json'])->post(
            $this->workspaceUrl('fmedatastreaming', $target),
            [
                'INIT_JSON'          => $request->input('init_json'),
                'SOURCE_FILE'        => '$(' . self::TEMP_CONNECTION . ')/' . $sourceFile,
                'opt_responseformat' => 'json',
                'token'              => $this->token(),
            ]
        );

        // Remember where FME says the form must be submitted, so step 3 doesn't trust the client.
        $next = $response->successful() ? $response->json('submitTarget') : null;
        if (is_array($next) && ! empty($next['repository']) && ! empty($next['workspace'])) {
            $request->session()->put('ontvangstloket.submit_target', [
                'repository' => (string) $next['repository'],
                'workspace'  => (string) $next['workspace'],
            ]);
        }

        return $this->forward($response);
    }

    /**
     * STEP 3: submit the filled-in INIT_JSON to the workspace returned in step 2.
     */
    public function submit(Request $request)
    {
        $request->validate([
            'init_json' => 'required|string|max:1000000',
        ]);

        $target = $request->session()->get('ontvangstloket.submit_target');
        if (! $target) {
            return response()->json(['message' => 'submitTarget ontbreekt, start opnieuw.'], 422);
        }

        $response = Http::asForm()->withHeaders(['Accept' => 'application/json'])->post(
            $this->workspaceUrl('fmedatadownload', $target),
            [
                'INIT_JSON'          => $request->input('init_json'),
                'opt_responseformat' => 'json',
                'token'              => $this->token(),
            ]
        );

        return $this->forward($response);
    }

    private function settings(): array
    {
        return json_decode(file_get_contents(public_path('js/ontvangstloket_iw/app_settings.json')), true);
    }

    private function token(): string
    {
        $token = (string) config('services.fme.token');
        abort_if($token === '', 500, 'FME_SERVER_TOKEN is niet geconfigureerd.');

        return $token;
    }

    private function baseUrl(): string
    {
        return rtrim((string) config('services.fme.base_url'), '/');
    }

    private function workspaceUrl(string $service, array $target): string
    {
        abort_if(empty($target['repository']) || empty($target['workspace']), 500, 'FME doel-workspace ontbreekt.');

        return sprintf(
            '%s/%s/%s/%s',
            $this->baseUrl(),
            $service,
            rawurlencode($target['repository']),
            rawurlencode($target['workspace'])
        );
    }

    private function forward(\Illuminate\Http\Client\Response $response)
    {
        return response($response->body(), $response->status())
            ->header('Content-Type', $response->header('Content-Type') ?: 'application/json');
    }
}


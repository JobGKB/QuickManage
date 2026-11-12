<?php

namespace App\Http\Controllers;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response as FmeResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

/**
 * "Dynamic URL" FME runner: /FmeRunDynamicURL?repo=..&workspace=..&<published parameters>
 *
 * The page first asks which service the workspace is registered for (services)
 * and then runs the workspace through that service (run).
 *
 * All FME calls go through here so FME_SERVER_TOKEN never reaches the browser.
 */
class FmeAppRunningCustomWorkspace extends Controller
{
    /** Preferred service first, for workspaces that are registered for more than one. */
    private const SERVICES = ['fmedatastreaming', 'fmedatadownload', 'fmejobsubmitter'];

    private const JOB_QUEUE = 'STANDARD';

    /** Seconds a workspace may run before we give up. */
    private const TIMEOUT = 600;

    public function index()
    {
        return view('fme_running_custom_workspace.index');
    }

    /**
     * STEP 1: the services the workspace is registered for, and the one we will use.
     */
    public function services(Request $request)
    {
        [$repository, $workspace] = $this->target($request);

        $registered = $this->registeredServices($repository, $workspace);

        return response()->json([
            'service'    => $registered[0] ?? null,
            'registered' => $registered,
        ]);
    }

    /**
     * STEP 2: run the workspace. Branches on the service found in step 1
     * (looked up again here when the client did not send it).
     */
    public function run(Request $request)
    {
        [$repository, $workspace] = $this->target($request);

        $request->validate([
            'service'    => ['nullable', Rule::in(self::SERVICES)],
            'parameters' => ['nullable', 'array'],
        ]);

        set_time_limit(self::TIMEOUT + 30);

        $service = $request->input('service')
            ?? ($this->registeredServices($repository, $workspace)[0] ?? null);
        $parameters = $this->publishedParameters($request);

        return match ($service) {
            'fmedatastreaming' => $this->runDataStreaming($repository, $workspace, $parameters),
            'fmedatadownload'  => $this->runDataDownload($repository, $workspace, $parameters),
            'fmejobsubmitter'  => $this->runJobSubmitter($repository, $workspace, $parameters),
            default            => response()->json(
                ['message' => 'Er zijn geen services beschikbaar voor deze workspace.'],
                422
            ),
        };
    }

    /**
     * fmejobsubmitter: submit the job, wait for it to finish and return its status as JSON.
     */
    private function runJobSubmitter(string $repository, string $workspace, array $parameters)
    {
        $submit = $this->api()->post($this->baseUrl() . '/fmeapiv4/jobs', [
            'repository'          => $repository,
            'workspace'           => $workspace,
            'queue'               => self::JOB_QUEUE,
            'publishedParameters' => (object) $parameters,
        ]);
        $this->abortIfFailed($submit, 'fmejobsubmitter submit');

        $id = $submit->json('id');

        $result = $this->api()->get(
            sprintf('%s/fmeapiv4/jobs/%s/result', $this->baseUrl(), rawurlencode((string) $id)),
            ['longPoll' => 'true']
        );
        $this->abortIfFailed($result, 'fmejobsubmitter result');

        return response()->json([
            'service'       => 'fmejobsubmitter',
            'id'            => $id,
            'status'        => $result->json('status'),
            'statusMessage' => $result->json('statusMessage'),
        ]);
    }

    /**
     * fmedatadownload: FME returns a JSON envelope with a temporary result URL,
     * which the page uses to download the file.
     */
    private function runDataDownload(string $repository, string $workspace, array $parameters)
    {
        $response = $this->servlet('fmedatadownload', $repository, $workspace, $parameters);
        $this->abortIfFailed($response, 'fmedatadownload');

        $url = $response->json('serviceResponse.url');
        if (! is_string($url) || $url === '') {
            Log::warning('FME dynamic run: no download url', ['repository' => $repository, 'workspace' => $workspace]);

            return response()->json(['message' => 'Geen download-URL in het antwoord van FME.'], 502);
        }

        return response()->json([
            'service' => 'fmedatadownload',
            'url'     => $url,
        ]);
    }

    /**
     * fmedatastreaming: streams the result (HTML for the iframe, or a file)
     * straight back to the page without buffering the whole payload in memory.
     */
    private function runDataStreaming(string $repository, string $workspace, array $parameters)
    {
        $upstream = $this->servlet('fmedatastreaming', $repository, $workspace, $parameters, stream: true);
        $this->abortIfFailed($upstream, 'fmedatastreaming');

        $body = $upstream->toPsrResponse()->getBody();

        $headers = ['Content-Type' => $upstream->header('Content-Type') ?: 'application/octet-stream'];
        if ($disposition = $upstream->header('Content-Disposition')) {
            $headers['Content-Disposition'] = $disposition;
        }

        return response()->stream(function () use ($body) {
            while (! $body->eof()) {
                echo $body->read(8192);
                flush();
            }
        }, 200, $headers);
    }

    /**
     * Repository and workspace come from the page URL, so only accept plain names
     * (no path separators or dot segments) before they are put into an FME URL.
     */
    private function target(Request $request): array
    {
        $name = ['required', 'string', 'max:255', 'regex:/^(?!\.+$)[^\/\\\\?#]+$/'];

        $data = $request->validate(['repo' => $name, 'workspace' => $name]);

        // FME workspace items are always `.fmw` files; ensure the extension is present.
        $workspace = preg_match('/\.fmw$/i', $data['workspace']) ? $data['workspace'] : $data['workspace'] . '.fmw';

        return [$data['repo'], $workspace];
    }

    /**
     * Registered services of the workspace, in order of preference.
     */
    private function registeredServices(string $repository, string $workspace): array
    {
        $response = $this->api()->timeout(30)->get(sprintf(
            '%s/fmeapiv4/workspaces/%s/%s/services',
            $this->baseUrl(),
            rawurlencode($repository),
            rawurlencode($workspace)
        ));
        $this->abortIfFailed($response, 'services');

        $services = (array) $response->json();

        return array_values(array_filter(
            self::SERVICES,
            fn (string $service) => (bool) ($services[$service]['registered'] ?? false)
        ));
    }

    /**
     * Published parameters as name => string, or name => list of strings for repeated names.
     */
    private function publishedParameters(Request $request): array
    {
        $parameters = [];

        foreach ((array) $request->input('parameters', []) as $name => $value) {
            if (is_array($value)) {
                $parameters[$name] = array_map('strval', array_values(array_filter($value, 'is_scalar')));
            } elseif (is_scalar($value) || $value === null) {
                // Empty values arrive as null (ConvertEmptyStringsToNull); FME expects an empty string.
                $parameters[$name] = (string) $value;
            }
        }

        return $parameters;
    }

    /**
     * Call the datastreaming / datadownload servlet. These authenticate via the
     * `token` request parameter, not the REST `Authorization: fmetoken` header.
     */
    private function servlet(string $service, string $repository, string $workspace, array $parameters, bool $stream = false): FmeResponse
    {
        $parameters['opt_responseformat'] = 'json';
        $parameters['token'] = $this->token();

        // Built by hand so a list value becomes repeated `name=value` pairs, as FME expects.
        $pairs = [];
        foreach ($parameters as $name => $value) {
            foreach ((array) $value as $item) {
                $pairs[] = rawurlencode((string) $name) . '=' . rawurlencode((string) $item);
            }
        }

        return Http::timeout(self::TIMEOUT)
            ->withOptions(['stream' => $stream])
            ->withBody(implode('&', $pairs), 'application/x-www-form-urlencoded')
            ->post(sprintf(
                '%s/%s/%s/%s',
                $this->baseUrl(),
                $service,
                rawurlencode($repository),
                rawurlencode($workspace)
            ));
    }

    private function api(): PendingRequest
    {
        return Http::timeout(self::TIMEOUT)->withHeaders([
            'Authorization' => 'fmetoken token=' . $this->token(),
            'Accept'        => 'application/json',
        ]);
    }

    /**
     * Stop with a generic JSON error; the FME details only go to the log (token redacted).
     */
    private function abortIfFailed(FmeResponse $response, string $step): void
    {
        if ($response->successful()) {
            return;
        }

        Log::warning('FME dynamic run failed', [
            'step'   => $step,
            'status' => $response->status(),
            'body'   => str_replace($this->token(), '[token]', mb_substr($response->body(), 0, 2000)),
        ]);

        abort(response()->json(
            ['message' => 'FME gaf een fout terug (' . $step . ').'],
            $response->status() === 404 ? 404 : 502
        ));
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
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\User;

class QuickDataViewerController extends Controller
{ 

 public function index()
    { 
        return view('quickdataviewer.index');
    }

 /**
  * Proxy a zipped .gdb file to FME Server for conversion to .gpkg.
  * Returns the .gpkg binary response to the browser.
  */
 public function convertGdb(Request $request)
    {
       
        set_time_limit(600);
        ini_set('memory_limit', '512M');

        $request->validate([
            'file' => 'required|file|max:512000', // max 500MB
        ]);

        $file = $request->file('file');

        // Validate it's a zip file
        if (strtolower($file->getClientOriginalExtension()) !== 'zip') {
            return response()->json(['message' => 'Alleen .zip bestanden zijn toegestaan.'], 422);
        }

        $fmeUrl = config('services.fme.url');
        $fmeToken = config('services.fme.token');

        if (!$fmeUrl || !$fmeToken) {
            return response()->json(['message' => 'FME Server is niet geconfigureerd.'], 500);
        }

         
        try {
            $fileName = $file->getClientOriginalName();

            // STEP 1: Upload the file to FME Server temp resources (v4 API)
            $uploadUrl = 'https://fme.gkbgroep.nl/fmeapiv4/resources/connections/FME_SHAREDRESOURCE_TEMP/upload?path&overwrite=true';

            $uploadPath = $file->getRealPath() ?: $file->getPathname();
            if (!$uploadPath || !is_readable($uploadPath)) {
                return response()->json(['message' => 'Geüpload bestand kon niet worden gelezen.'], 422);
            }

            $uploadResponse = Http::timeout(300)
                ->withHeaders([
                    'Authorization' => 'fmetoken token=' . $fmeToken,
                    'Accept' => 'application/json',
                ])
                ->attach('files', fopen($uploadPath, 'r'), $fileName)
                ->post($uploadUrl);
            // dd($uploadResponse);
            if (!$uploadResponse->successful()) {
                return $this->fmeError('FME upload fout (' . $uploadResponse->status() . ').', 502,
                    'upload failed: ' . $uploadResponse->status() . ' - ' . $uploadResponse->body(), $fmeToken);
            }

            // STEP 2: Run the data streaming workspace with the uploaded file reference
            $streamingUrl = $fmeUrl . '?' . http_build_query([
                'fileGDB' => '$(FME_SHAREDRESOURCE_TEMP)/' . $fileName,
                'opt_responseformat' => 'json',
                'token' => $fmeToken,
            ]);

            $response = Http::timeout(300)
                ->get($streamingUrl);

            if (!$response->successful()) {
                return $this->fmeError('FME Server fout (' . $response->status() . ').', $response->status(),
                    'workspace failed: ' . $response->status() . ' - ' . $response->body(), $fmeToken);
            }

            // FME data streaming may return JSON with a download URL or the binary gpkg directly
            $contentType = $response->header('Content-Type');

            if (str_contains($contentType, 'application/json')) {
                $json = $response->json();

                $downloadUrl = $json['serviceResponse']['url'] ?? null;
                if (!$downloadUrl) {
                    return $this->fmeError('FME Server gaf geen download URL terug.', 502,
                        'no download URL in response: ' . json_encode($json), $fmeToken);
                }

                // Download the actual gpkg from FME
                $gpkgResponse = Http::timeout(300)
                    ->get($downloadUrl, ['token' => $fmeToken]);

                if (!$gpkgResponse->successful()) {
                    return response()->json([
                        'message' => 'Fout bij downloaden GPKG van FME: ' . $gpkgResponse->status(),
                    ], 502);
                }

                return response($gpkgResponse->body(), 200)
                    ->header('Content-Type', 'application/octet-stream')
                    ->header('Content-Disposition', 'attachment; filename="converted.gpkg"');
            }

            // Binary response — return directly
            return response($response->body(), 200)
                ->header('Content-Type', 'application/octet-stream')
                ->header('Content-Disposition', 'attachment; filename="converted.gpkg"');

        } catch (\Exception $e) {
            return $this->fmeError('Fout bij communicatie met FME Server.', 502,
                'exception: ' . get_class($e) . ' - ' . $e->getMessage(), $fmeToken);
        }
    }

 /**
  * Proxy a .dwg file to FME Server for conversion to .gpkg.
  * Returns the .gpkg binary response to the browser.
  */
 public function convertDwg(Request $request)
    {
        set_time_limit(600);
        ini_set('memory_limit', '512M');

        $request->validate([
            'file' => 'required|file|max:512000', // max 500MB
        ]);

        $file = $request->file('file');

        // Validate it's a dwg file
        if (strtolower($file->getClientOriginalExtension()) !== 'dwg') {
            return response()->json(['message' => 'Alleen .dwg bestanden zijn toegestaan.'], 422);
        }

        $fmeDwgUrl = config('services.fme.dwg_url');
        $fmeToken  = config('services.fme.token');

        if (!$fmeDwgUrl || !$fmeToken) {
            return response()->json(['message' => 'FME Server (DWG) is niet geconfigureerd.'], 500);
        }

        try {
            $fileName = $file->getClientOriginalName();

            // STEP 1: Upload the DWG file to FME Server temp resources (v4 API)
            $uploadUrl = 'https://fme.gkbgroep.nl/fmeapiv4/resources/connections/FME_SHAREDRESOURCE_TEMP/upload?path&overwrite=true';

            $uploadPath = $file->getRealPath() ?: $file->getPathname();
            if (!$uploadPath || !is_readable($uploadPath)) {
                return response()->json(['message' => 'Geüpload bestand kon niet worden gelezen.'], 422);
            }

            $uploadResponse = Http::timeout(300)
                ->withHeaders([
                    'Authorization' => 'fmetoken token=' . $fmeToken,
                    'Accept' => 'application/json',
                ])
                ->attach('files', fopen($uploadPath, 'r'), $fileName)
                ->post($uploadUrl);

            if (!$uploadResponse->successful()) {
                return $this->fmeError('FME upload fout (' . $uploadResponse->status() . ').', 502,
                    'upload failed: ' . $uploadResponse->status() . ' - ' . $uploadResponse->body(), $fmeToken);
            }

            // STEP 2: Run the DWG data streaming workspace with the uploaded file reference
            $streamingUrl = $fmeDwgUrl . '?' . http_build_query([
                'fileDWG' => '$(FME_SHAREDRESOURCE_TEMP)/' . $fileName,
                'opt_responseformat' => 'json',
                'token' => $fmeToken,
            ]);

            $response = Http::timeout(300)
                ->get($streamingUrl);

            if (!$response->successful()) {
                return $this->fmeError('FME Server fout (' . $response->status() . ').', $response->status(),
                    'workspace failed: ' . $response->status() . ' - ' . $response->body(), $fmeToken);
            }

            // FME data streaming may return JSON with a download URL or the binary gpkg directly
            $contentType = $response->header('Content-Type');

            if (str_contains($contentType, 'application/json')) {
                $json = $response->json();

                $downloadUrl = $json['serviceResponse']['url'] ?? null;
                if (!$downloadUrl) {
                    return $this->fmeError('FME Server gaf geen download URL terug.', 502,
                        'no download URL in response: ' . json_encode($json), $fmeToken);
                }

                // Download the actual gpkg from FME
                $gpkgResponse = Http::timeout(300)
                    ->get($downloadUrl, ['token' => $fmeToken]);

                if (!$gpkgResponse->successful()) {
                    return response()->json([
                        'message' => 'Fout bij downloaden GPKG van FME: ' . $gpkgResponse->status(),
                    ], 502);
                }

                return response($gpkgResponse->body(), 200)
                    ->header('Content-Type', 'application/octet-stream')
                    ->header('Content-Disposition', 'attachment; filename="converted.gpkg"');
            }

            // Binary response — return directly
            return response($response->body(), 200)
                ->header('Content-Type', 'application/octet-stream')
                ->header('Content-Disposition', 'attachment; filename="converted.gpkg"');

        } catch (\Exception $e) {
            return $this->fmeError('Fout bij communicatie met FME Server.', 502,
                'exception: ' . get_class($e) . ' - ' . $e->getMessage(), $fmeToken);
        }
    }

 /**
  * Log FME error details server-side (token redacted) and return only a generic message to the client,
  * so the FME token or raw FME responses never reach the browser.
  */
 private function fmeError(string $message, int $status, string $detail, ?string $token)
    {
        if ($token) {
            $detail = str_replace([$token, urlencode($token), rawurlencode($token)], '[REDACTED]', $detail);
        }
        Log::error('QuickDataViewer FME ' . $detail);

        return response()->json(['message' => $message], $status);
    }
}

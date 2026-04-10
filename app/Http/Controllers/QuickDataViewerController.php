<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
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
            $uploadUrl = 'https://fme-gkb.fmecloud.com/fmeapiv4/resources/connections/FME_SHAREDRESOURCE_TEMP/upload?path&overwrite=true';

            $uploadResponse = Http::withoutVerifying()
                ->timeout(300)
                ->withHeaders([
                    'Authorization' => 'fmetoken token=' . $fmeToken,
                    'Accept' => 'application/json',
                ])
                ->attach('files', fopen($file->getRealPath(), 'r'), $fileName)
                ->post($uploadUrl);

            if (!$uploadResponse->successful()) {
                return response()->json([
                    'message' => 'FME upload fout: ' . $uploadResponse->status() . ' - ' . $uploadResponse->body(),
                ], 502);
            }

            // STEP 2: Run the data streaming workspace with the uploaded file reference
            $streamingUrl = $fmeUrl . '?' . http_build_query([
                'fileGDB' => '$(FME_SHAREDRESOURCE_TEMP)/' . $fileName,
                'opt_responseformat' => 'json',
                'token' => $fmeToken,
            ]);

            $response = Http::withoutVerifying()
                ->timeout(300)
                ->get($streamingUrl);

            if (!$response->successful()) {
                return response()->json([
                    'message' => 'FME Server fout: ' . $response->status() . ' - ' . $response->body(),
                ], $response->status());
            }

            // FME data streaming may return JSON with a download URL or the binary gpkg directly
            $contentType = $response->header('Content-Type');

            if (str_contains($contentType, 'application/json')) {
                $json = $response->json();

                $downloadUrl = $json['serviceResponse']['url'] ?? null;
                if (!$downloadUrl) {
                    return response()->json([
                        'message' => 'FME Server gaf geen download URL terug.',
                        'fme_response' => $json,
                    ], 502);
                }

                // Download the actual gpkg from FME
                $gpkgResponse = Http::withoutVerifying()
                    ->timeout(300)
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
            return response()->json([
                'message' => 'Fout bij communicatie met FME Server: ' . $e->getMessage(),
            ], 502);
        }
    }

 /**
  * Proxy a .dwg file to FME Server for conversion to .gpkg.
  * Returns the .gpkg binary response to the browser.
  */
 public function convertDwg(Request $request)
    {
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
            $uploadUrl = 'https://fme-gkb.fmecloud.com/fmeapiv4/resources/connections/FME_SHAREDRESOURCE_TEMP/upload?path&overwrite=true';

            $uploadResponse = Http::withoutVerifying()
                ->timeout(300)
                ->withHeaders([
                    'Authorization' => 'fmetoken token=' . $fmeToken,
                    'Accept' => 'application/json',
                ])
                ->attach('files', fopen($file->getRealPath(), 'r'), $fileName)
                ->post($uploadUrl);

            if (!$uploadResponse->successful()) {
                return response()->json([
                    'message' => 'FME upload fout: ' . $uploadResponse->status() . ' - ' . $uploadResponse->body(),
                ], 502);
            }

            // STEP 2: Run the DWG data streaming workspace with the uploaded file reference
            $streamingUrl = $fmeDwgUrl . '?' . http_build_query([
                'fileDWG' => '$(FME_SHAREDRESOURCE_TEMP)/' . $fileName,
                'opt_responseformat' => 'json',
                'token' => $fmeToken,
            ]);

            $response = Http::withoutVerifying()
                ->timeout(300)
                ->get($streamingUrl);

            if (!$response->successful()) {
                return response()->json([
                    'message' => 'FME Server fout: ' . $response->status() . ' - ' . $response->body(),
                ], $response->status());
            }

            // FME data streaming may return JSON with a download URL or the binary gpkg directly
            $contentType = $response->header('Content-Type');

            if (str_contains($contentType, 'application/json')) {
                $json = $response->json();

                $downloadUrl = $json['serviceResponse']['url'] ?? null;
                if (!$downloadUrl) {
                    return response()->json([
                        'message' => 'FME Server gaf geen download URL terug.',
                        'fme_response' => $json,
                    ], 502);
                }

                // Download the actual gpkg from FME
                $gpkgResponse = Http::withoutVerifying()
                    ->timeout(300)
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
            return response()->json([
                'message' => 'Fout bij communicatie met FME Server: ' . $e->getMessage(),
            ], 502);
        }
    }
}

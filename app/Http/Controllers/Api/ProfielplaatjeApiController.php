<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ProfielPlaatjeService;
use App\Support\ZipWriter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ProfielplaatjeApiController extends Controller
{
    /** Opslagmap voor gegenereerde zips: storage/app/profielplaatjes. */
    private function opslagMap(): string
    {
        return storage_path('app/profielplaatjes');
    }

    /**
     * Ontvangt profielplaatje-data, genereert per profiel een PDF, bundelt ze
     * in een zip in de storage-map en geeft status + downloadlink terug.
     */
    public function generate(Request $request, ProfielPlaatjeService $service): JsonResponse
    {
        // Grote batches (bv. 37 profielen) duren langer dan de standaard 30s; geef ruimte.
        set_time_limit(0);
        ini_set('memory_limit', '1024M');

        $validated = $request->validate([
            'profielen'                    => 'required|array|min:1|max:250',
            'profielen.*.profielcode'           => 'required|string|max:50',
            'profielen.*.project'          => 'nullable|string|max:255',
            'profielen.*.opdrachtgever'    => 'nullable|string|max:255', 
            'profielen.*.omschrijving'    => 'nullable|string|max:255',
            'profielen.*.baggercode'        => 'nullable|string|max:100',
            'profielen.*.legger'        => 'nullable|string|max:100',
            'profielen.*.polderpeil'        => 'nullable|string|max:100',
            'profielen.*.waterpeil'        => 'nullable|string|max:100',
            'profielen.*.dynamic_fields'    => 'required|array|min:1',
            'profielen.*.punten'           => 'required|array|min:1',
        ], [
            'profielen.max' => 'Maximaal 250 profielen per aanvraag. Splits de aanvraag op in kleinere delen (chunking).',
        ]);

        $profielen = $validated['profielen'];

        $dir = $this->opslagMap();
        if (! is_dir($dir) && ! mkdir($dir, 0755, true) && ! is_dir($dir)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Opslagmap kon niet worden aangemaakt.',
            ], 500);
        }

        $zipName = 'profielplaatjes_'.now()->format('Ymd_His').'_'.Str::random(6).'.zip';
        $zipPath = $dir.DIRECTORY_SEPARATOR.$zipName;

        try {
            $zip = new ZipWriter();

            $gebruikteNamen = [];
            foreach ($profielen as $index => $profiel) {
                $pdf = $service->renderPdf($profiel);

                $basis = 'profiel-'.($this->veiligeNaam($profiel['profielcode']) ?: (string) ($index + 1));
                $pdfNaam = $basis.'.pdf';
                if (isset($gebruikteNamen[$pdfNaam])) {
                    $pdfNaam = $basis.'-'.($index + 1).'.pdf';
                }
                $gebruikteNamen[$pdfNaam] = true;

                $zip->add($pdfNaam, $pdf);
                unset($pdf); // geheugen vrijgeven per profiel bij grote batches
            }

            if (file_put_contents($zipPath, $zip->finish()) === false) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Zip-bestand kon niet worden opgeslagen.',
                ], 500);
            }
        } catch (\Throwable $e) {
            Log::error('Profielplaatjes genereren mislukt', ['exception' => $e]);
            if (is_file($zipPath)) {
                @unlink($zipPath);
            }

            return response()->json([
                'status'  => 'error',
                'message' => 'Genereren van de profielplaatjes is mislukt.',
            ], 500);
        }

        return response()->json([
            'status'       => 'success',                                                        
            'message'      => count($profielen).' profielplaatje(s) gegenereerd.',              
            'count'        => count($profielen),                                                
            'zipfile'      => $zipName,                                                         
            'download_url' => route('profielplaatjes.download', ['file' => $zipName]),          
            'generated_at' => now()->toIso8601String(),                                         
        ]);
    }

    /**
     * Downloadt een eerder gegenereerde zip uit de storage-map.
     */
    public function download(string $file): BinaryFileResponse|JsonResponse
    {
        // Alleen de bestandsnaam toestaan (padtraversal is al geweerd via de route-constraint).
        $file = basename($file);
        $path = $this->opslagMap().DIRECTORY_SEPARATOR.$file;

        if (! is_file($path)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Bestand niet gevonden.',
            ], 404);
        }

        return response()->download($path, $file, [
            'Content-Type' => 'application/zip',
        ]);
    }

    /**
     * Maakt een veilige bestandsnaam-component van een waarde.
     */
    private function veiligeNaam(string $waarde): string
    {
        return preg_replace('/[^A-Za-z0-9._-]/', '', $waarde) ?? '';
    }
}

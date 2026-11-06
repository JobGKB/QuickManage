<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class PBA_IWController extends Controller
{
    public function index()
    {
        return view('pba_fmuta6_indexatie_tarieven_beheren.index');
    }

    /**
     * Proxy for the FME Cloud indexatie API, so FME_PBA_TOKEN stays server-side.
     */
    public function indexaties()
    {
        return $this->forward($this->client()->get($this->url()));
    }

    public function saveIndexaties(Request $request)
    {
        $data = $request->validate([
            'json' => 'required|string|max:1000000',
        ]);

        return $this->forward($this->client()->post($this->url(), ['json' => $data['json']]));
    }

    /**
     * Proxy for the FME datastreaming Excel export, so FME_PBA_DOWNLOAD_TOKEN stays server-side.
     */
    public function download()
    {
        $token = (string) config('services.fme.pba_download_token');
        abort_if($token === '', 500, 'FME_PBA_DOWNLOAD_TOKEN is niet geconfigureerd.');

        $response = Http::timeout(120)->get((string) config('services.fme.pba_download_url'), [
            'DestDataset_FILECOPY' => 'c:\\temp',
            'token'                => $token,
        ]);

        abort_unless($response->successful(), 502, 'Downloaden van het indexatiebestand is mislukt.');

        return response($response->body(), 200, array_filter([
            'Content-Type'        => $response->header('Content-Type') ?: 'application/octet-stream',
            'Content-Disposition' => $response->header('Content-Disposition') ?: 'attachment; filename="Indexatie.xlsx"',
        ]));
    }

    private function client()
    {
        $token = (string) config('services.fme.pba_token');
        abort_if($token === '', 500, 'FME_PBA_TOKEN is niet geconfigureerd.');

        return Http::withHeaders([
            'Authorization' => 'fmetoken token=' . $token,
            'Accept'        => 'application/json',
        ])->withQueryParameters(['DEBUG' => 'NO']);
    }

    private function url(): string
    {
        return (string) config('services.fme.pba_indexatie_url');
    }

    private function forward(\Illuminate\Http\Client\Response $response)
    {
        return response($response->body(), $response->status())
            ->header('Content-Type', $response->header('Content-Type') ?: 'application/json');
    }
}

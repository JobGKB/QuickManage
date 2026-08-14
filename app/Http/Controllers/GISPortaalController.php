<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GISPortaalController extends Controller
{
    public function index()
    {
        $client_id = config('services.arcgis.client_id');

        // $token = session('arcgis.access_token'); // if you have it
        // // dd($token);

        // $layerUrl = 'https://services9.arcgis.com/CjT8oELYhF7fnj6q/arcgis/rest/services/Testpunten/FeatureServer/0';
        // $allowedFields = $this->getLayerFields($layerUrl, $token);
 
        // ophalen van projectcodes
        // $layerUrl = 'https://services9.arcgis.com/CjT8oELYhF7fnj6q/arcgis/rest/services/GKB_DL_Bomen/FeatureServer/0/query';
        $token = session('arcgis.access_token');
        $params = [
            'f' => 'json',
            'where' => '1=1',
            'returnGeometry' => 'false',
            // group + stats
            'groupByFieldsForStatistics' => 'projectcode',
            'outStatistics' => json_encode([
                [
                    'statisticType' => 'count',
                    'onStatisticField' => 'OBJECTID',
                    'outStatisticFieldName' => 'cnt',
                ]
            ]),
            // make sure group field is returned
            'outFields' => 'projectcode',
            // order by the output stat field name
            'orderByFields' => 'cnt DESC',
            // optional: include NULL group if the service allows it
            // 'where' => 'projectcode IS NOT NULL', // alternatively filter nulls out
        ];
        if (!empty($token)) {
            $params['token'] = $token;
        }

        // $res = Http::withOptions(['verify' => app()->isProduction()])
        //     ->get($layerUrl, $params)
        //     ->json();

        $features = $res['features'] ?? [];
        // dd($features);

        $data = collect($features)->map(function ($item) {
            return [
                'projectcode' => $item['attributes']['projectcode'] ?? null,
                'cnt' => $item['attributes']['cnt'] ?? 0,
            ];
        });
        // dd($data);

        $groups = $this->getUserGroups($token);

        //redirect
        return view('gisportaal.index', [
            'client_id' => $client_id,
            'data' => $data,
            'groups' => $groups,
        ]);
    }

    /**
     * Fetch the ArcGIS groups the logged-in user has access to.
     */
    protected function getUserGroups(?string $token)
    {
        if (empty($token)) {
            return collect();
        }

        $portal = rtrim(config('services.arcgis.portal'), '/');

        try {
            $response = Http::withOptions(['verify' => app()->isProduction()])
                ->timeout(10)
                ->connectTimeout(5)
                ->retry(2, 200)
                ->get($portal . '/sharing/rest/community/self', [
                    'f' => 'json',
                    'token' => $token,
                ])
                ->json();
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            report($e);
            return collect();
        }

        return collect($response['groups'] ?? [])->map(function ($group) {
            return [
                'id' => $group['id'] ?? null,
                'title' => $group['title'] ?? null,
            ];
        })->sortBy('title', SORT_NATURAL | SORT_FLAG_CASE)->values();
    }

    /**
     * Fetch only the Web Maps that belong to a given ArcGIS group.
     */
    public function groupMaps(string $groupId)
    {
        $token = session('arcgis.access_token');
        $portal = rtrim(config('services.arcgis.portal'), '/');

        try {
            // Use the item search endpoint (same one AGOL's own group content
            // tab uses) instead of content/groups/{id}, which can miss items
            // that were shared to the group by other members.
            $response = Http::withOptions(['verify' => app()->isProduction()])
                ->timeout(10)
                ->connectTimeout(5)
                ->retry(2, 200)
                ->get($portal . '/sharing/rest/search', [
                    'f' => 'json',
                    'token' => $token,
                    'q' => "group:{$groupId} AND type:\"Web Map\"",
                    'num' => 100,
                    'sortField' => 'title',
                    'sortOrder' => 'asc',
                ])
                ->json();
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            report($e);
            return response()->json(['message' => 'ArcGIS reageerde niet op tijd, probeer het opnieuw.'], 504);
        }

        if (isset($response['error'])) {
            return response()->json(['message' => 'Kon groepsinhoud niet ophalen.'], 500);
        }

        $maps = collect($response['results'] ?? [])
            ->filter(fn ($item) => ($item['type'] ?? null) === 'Web Map')
            ->map(function ($item) {
                return [
                    'id' => $item['id'] ?? null,
                    'title' => $item['title'] ?? null,
                ];
            })
            ->sortBy('title', SORT_NATURAL | SORT_FLAG_CASE)
            ->values();

        return response()->json(['maps' => $maps]);
    }

    public function callback(Request $request)
    {
        // dd($request);
        $code = $request->query('code');
        if (!$code) {
            abort(400, 'Missing authorization code (code).');
        }
         
        $portal = rtrim(config('services.arcgis.portal'), '/'); // https://www.arcgis.com

        //withOptions(['verify' => false]) alleen gebruiken in local developmode 

        $response = Http::withOptions(['verify' => app()->isProduction()])
            ->timeout(10)
            ->connectTimeout(5)
            ->asForm()->post($portal . '/sharing/rest/oauth2/token', [
            'client_id'     => config('services.arcgis.client_id'),
            'client_secret' => config('services.arcgis.client_secret'),
            'grant_type'    => 'authorization_code',
            'code'          => $code,
            'redirect_uri'  => config('services.arcgis.redirect_uri'),
            'f'             => 'json',
        ]);

        if (!$response->ok()) {
            abort(500, 'Token endpoint error: ' . $response->body());
        }

        $data = $response->json();
        // dd($data);

        if (isset($data['error'])) {
            abort(500, 'ArcGIS token error: ' . json_encode($data['error']));
        }

        // ArcGIS typically returns: access_token, expires_in, username, ssl, refresh_token (depending on settings)
        $accessToken = $data['access_token'] ?? null;
        if (!$accessToken) {
            abort(500, 'No access_token returned: ' . json_encode($data));
        }

        // Store token in session (simple approach)
        session([
            'arcgis.access_token' => $accessToken,
            'arcgis.expires_in'   => $data['expires_in'] ?? null,
            'arcgis.expires_at'   => isset($data['expires_in']) ? now()->addSeconds($data['expires_in'])->timestamp : null,
            'arcgis.username'     => $data['username'] ?? null,
        ]);

        return redirect()->route('gisportaal')->with('status', 'ArcGIS connected.');
    }
}

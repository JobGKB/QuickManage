<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\App;
use App\Models\CustomApp;
use App\Models\AppCategorie;
use App\Models\Template;
use App\Models\userAnalytics;

class AnalyticsController extends Controller
{
    //

     public function index(Request $request)
    {
      
        $apps = App::all();
        $customApps = CustomApp::all();
        $categories = AppCategorie::all();
        $totaal_Apps = $apps->count();
        $totaal_CustomApps = $customApps->count();
        $all_Apps = $totaal_Apps + $totaal_CustomApps;
        $totaal_Categories = $categories->count();
        $totaal_Templates = Template::all()->count();


        // dd($request);
        return view('pages.analytics.index', [
        
            'apps' => $apps,
            'totaal_Apps' => $totaal_Apps,
            'totaal_CustomApps' => $totaal_CustomApps,
            'all_Apps' => $all_Apps,
            'totaal_Categories' => $totaal_Categories,
            'categories' => $categories,
            'customApps' => $customApps,
            'totaal_Templates' => $totaal_Templates

            ]);
    }


    public function liveVisitors()
    {
        // Also catches the last visitor leaving, since no heartbeat triggers the update then.
        userAnalytics::markInactive();

        $count = userAnalytics::where('active', '1')->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Return the pages/apps currently in use, with the names of their active visitors.
     */
    public function liveApps()
    {
        userAnalytics::markInactive();

        $visitors = userAnalytics::where('active', '1')
            ->get(['page_url', 'visitorName']);

        $appNames = App::whereIn('hash_id', $visitors->map(fn ($visitor) => $this->appHashId($visitor->page_url))->filter()->unique())
            ->pluck('name', 'hash_id');

        $apps = $visitors
            ->groupBy(fn ($visitor) => (string) $visitor->page_url)
            ->map(function ($group, $pageUrl) use ($appNames) {
                $hashId = $this->appHashId($pageUrl);

                return [
                    'page_url' => '/' . $pageUrl,
                    'label'    => ($hashId ? $appNames->get($hashId) : null) ?? '/' . $pageUrl,
                    'visitors' => $group->map(fn ($visitor) => $visitor->visitorName ?: 'Onbekend')
                        ->sort()
                        ->values(),
                ];
            })
            ->sortByDesc(fn ($app) => $app['visitors']->count())
            ->values();

        return response()->json(['apps' => $apps]);
    }

    /**
     * Tracked app pages look like "apps/view/{hash_id}".
     */
    private function appHashId(?string $pageUrl): ?string
    {
        return $pageUrl && preg_match('#^apps/view/([^/]+)#', $pageUrl, $matches) ? $matches[1] : null;
    }


}

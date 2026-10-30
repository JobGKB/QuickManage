<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\App;
use App\Models\userAnalytics;

class AnalyticsController extends Controller
{
    //

     public function index(Request $request)
    {
        $ip = $request->ip();

        // dd($request);
        return view('pages.analytics.index', ['ip' => $ip,  ]);
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

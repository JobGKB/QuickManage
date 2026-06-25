<?php

namespace App\Http\Middleware;

use App\Models\userAnalytics;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use App\Models\App;
class TrackPageVisit
{
    /**
     * Record a heartbeat for the current visitor on a tracked page.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $visitorId = $request->cookie('visitor_id');
        $pageUrl = $request->query('page_url', $request->path());
        // dd($request);
        if (!is_string($pageUrl) || $pageUrl === '') {
            $pageUrl = $request->path();
        }

        $pageUrl = ltrim($pageUrl, '/');

        if (strlen($pageUrl) > 255) {
            $pageUrl = substr($pageUrl, 0, 255);
        }

        if ($visitorId) {
            try {
                userAnalytics::updateOrCreate(
                    ['visitor_id' => $visitorId],
                    [
                        'page_url'     => $pageUrl,
                        'last_seen_at' => now(),
                        'active'       => '1',
                    ]
                );
            } catch (\Throwable $e) {
                // Never let analytics break the page render.
                Log::warning('TrackPageVisit failed: ' . $e->getMessage());
            }
        }

        return $next($request);
    }
}

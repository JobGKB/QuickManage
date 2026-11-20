<?php
namespace App\Http\Middleware;
use Illuminate\Support\Facades\Auth;

use App\Models\AnalyticReport;
use App\Models\userAnalytics;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use App\Models\App;
class TrackPageVisit
{
    /**
     * Record a heartbeat for the current visitor on a tracked page, and log app page views.
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
                $attributes = [
                    'page_url'     => $pageUrl,
                    'last_seen_at' => now(),
                    'active'       => '1',
                ];

                $visitorName = $this->resolveVisitorName($request);

                // Only overwrite when known, so an earlier name isn't wiped by a null.
                if ($visitorName !== null) {
                    $attributes['visitorName'] = $visitorName;
                }

                userAnalytics::updateOrCreate(['visitor_id' => $visitorId], $attributes);

                // Sweep stale visitors at most once per window instead of on every heartbeat.
                if (Cache::add('user_analytics:mark_inactive', true, userAnalytics::INACTIVE_AFTER_SECONDS)) {
                    userAnalytics::markInactive();
                }
            } catch (\Throwable $e) {
                // Never let analytics break the page render.
                Log::warning('TrackPageVisit failed: ' . $e->getMessage());
            }
        }

        $response = $next($request);

        // Only after a successful render, so login redirects and unknown apps (404) aren't counted.
        if ($response->isSuccessful()) {
            $this->recordAppView($request);
        }

        return $response;
    }

    /**
     * Log one analytic_reports row (views = 1) for a page view of an app.
     *
     * Only apps/view/{unique} counts: analytic_reports.app_id references apps, and the heartbeat
     * and FME proxy XHR calls in the same route group are not page views.
     */
    private function recordAppView(Request $request): void
    {
        if (!$request->isMethod('GET') || !$request->routeIs('apps.view')) {
            return;
        }

        try {
            $appId = App::where('hash_id', $request->route('unique'))->value('id');

            if ($appId !== null) {
                AnalyticReport::create([
                    'date'   => now()->toDateString(),
                    'app_id' => $appId,
                    'views'  => 1,
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('TrackPageVisit app view failed: ' . $e->getMessage());
        }
    }

    private function resolveVisitorName(Request $request): ?string
    {
        if ($user = Auth::user()) {
            $name = $user->name ?: $user->email;
        } else {
            $azureUser = $request->session()->get('azure.user');
            $name = $azureUser['name'] ?? $azureUser['email'] ?? null;
        }

        $name = is_string($name) ? trim($name) : '';

        return $name === '' ? null : mb_substr($name, 0, 255);
    }
}

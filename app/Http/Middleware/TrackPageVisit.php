<?php
namespace App\Http\Middleware;
use Illuminate\Support\Facades\Auth;

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

        return $next($request);
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

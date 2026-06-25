<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class SetVisitorIdCookie
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->hasCookie('visitor_id')) {
            Cookie::queue(
                'visitor_id',
                (string) Str::uuid(),
                60 * 24 * 365 // 1 jaar
            );
        }

        return $next($request);
    }
}

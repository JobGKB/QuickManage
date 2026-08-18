<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class RequireAzureLogin
{
    /**
     * Ensure the visitor is signed in via Microsoft Entra ID with an
     * e-mail in the allowed domain (e.g. @gkbgroep.nl).
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Users already signed in through the normal username/password login
        // don't need SSO.
        if (Auth::check()) {
            return $next($request);
        }

        $user = $request->session()->get('azure.user');

        // Not logged in yet: send them to Microsoft, remembering the target URL.
        if (! $user || empty($user['email'])) {
            return redirect()->route('azure.login', ['redirect' => $request->fullUrl()]);
        }

        $allowedDomain = strtolower(config('services.azure.allowed_domain'));

        // Logged in but with a non-allowed account: deny access.
        if (! Str::endsWith(strtolower($user['email']), '@' . $allowedDomain)) {
            $request->session()->forget('azure.user');

            return response()->view('errors.azure-forbidden', [
                'email'         => $user['email'],
                'allowedDomain' => $allowedDomain,
            ], 403);
        }

        return $next($request);
    }
}

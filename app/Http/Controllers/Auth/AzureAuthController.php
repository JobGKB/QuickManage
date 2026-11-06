<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
 

class AzureAuthController extends Controller
{
    /**
     * Redirect the user to the Microsoft Entra ID (Azure AD) login page.
     */
    public function redirect(Request $request)
    {
        // Remember where the user wanted to go so we can send them back after login.
        if ($target = $request->query('redirect')) {
            $request->session()->put('azure.intended', $target);
        }

        return Socialite::driver('azure')
            ->scopes(['openid', 'profile', 'email', 'User.Read'])
            ->redirect();
    }

    /**
     * Handle the callback from Microsoft and verify the account domain.
     */
    public function callback(Request $request)
    {
        try {
            $azureUser = Socialite::driver('azure')->user();
            // dd($azureUser);
        } catch (\Throwable $e) {
            report($e);
            Log::warning('Azure SSO callback failed', [
                'exception'     => get_class($e),
                'message'       => $e->getMessage(),
                'state_matches' => session('state') !== null && session('state') === request('state'),
                'is_secure'     => request()->isSecure(), // should be true behind HTTPS proxy
                'scheme'        => request()->getScheme(),
            ]);
            return redirect('/')->with('error', 'Aanmelden bij Microsoft is mislukt, probeer het opnieuw.');
        }

        $email = strtolower(trim($azureUser->getEmail() ?? ''));
        $allowedDomains = config('services.azure.allowed_domains', []);

        // Only allow accounts whose e-mail ends with one of the configured domains.
        if ($email === '' || ! Str::endsWith($email, array_map(fn ($d) => '@' . $d, $allowedDomains))) {
            $request->session()->forget('azure.user');

            return response()->view('errors.azure-forbidden', [
                'email'          => $email,
                'allowedDomains' => $allowedDomains,
            ], 403);
        }

        // Store the verified user in the session.
        $request->session()->put('azure.user', [
            'id'    => $azureUser->getId(),
            'name'  => $azureUser->getName(),
            'email' => $email,
        ]);

        $intended = $request->session()->pull('azure.intended', '/app-gallery/overzicht');

        return redirect($intended);
    }

    /**
     * Sign the user out of the Azure session.
     */
    public function logout(Request $request)
    {
        $request->session()->forget('azure.user');
        $request->session()->regenerateToken();

        return redirect('/')->with('status', 'Je bent afgemeld.');
    }
}

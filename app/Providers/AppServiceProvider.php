<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Event;
use SocialiteProviders\Manager\SocialiteWasCalled;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register the Microsoft Entra ID (Azure) driver for Socialite.
        Event::listen(SocialiteWasCalled::class, [
            \SocialiteProviders\Azure\AzureExtendSocialite::class,
            'handle',
        ]);
    }
}

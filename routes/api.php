<?php

use App\Http\Controllers\Api\ProfielplaatjeApiController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Stateless JSON endpoints (o.a. voor FME). Deze routes vallen in de
| "api" middleware-groep en gebruiken geen sessie/CSRF.
|
*/

// Ontvangt profielplaatje-data (JSON), genereert per profiel een PDF,
// bundelt ze in een zip en geeft een downloadlink terug.
Route::post('/profielplaatjes/generate', [ProfielplaatjeApiController::class, 'generate'])
    ->name('profielplaatjes.generate');

// Downloadt een eerder gegenereerde zip.
Route::get('/profielplaatjes/download/{file}', [ProfielplaatjeApiController::class, 'download'])
    ->name('profielplaatjes.download')
    ->where('file', '[A-Za-z0-9._-]+');

<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\LogoutAGOLController;
/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/
Route::get('/ping', fn() => 'pong');

Route::get('/', function () {
    return view('auth.login');
});

Auth::routes(['verify' => true]);

// All routes below require authentication
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\DashboardController::class, 'index']);

    // Route::get('/apps', [App\Http\Controllers\AppsController::class, 'index']);
    // Manage (fme) App routes
    Route::get('/manage/apps/create', [App\Http\Controllers\AppsController::class, 'create']);
    Route::post('/manage/apps/store', [App\Http\Controllers\AppsController::class, 'store']);
    Route::get('/manage/apps/edit/{unique}', [App\Http\Controllers\AppsController::class, 'edit']);
    Route::patch('/manage/apps/update/{id}', [App\Http\Controllers\AppsController::class, 'update']);
    Route::delete('/manage/apps/delete/{id}', [App\Http\Controllers\AppsController::class, 'destroy']);

    // Manage Custom App routes
    Route::get('/manage/custom-apps/create', [App\Http\Controllers\CustomAppsController::class, 'create']);
    Route::post('/manage/custom-apps/store', [App\Http\Controllers\CustomAppsController::class, 'store']);
    Route::get('/manage/custom-apps/edit/{unique}', [App\Http\Controllers\CustomAppsController::class, 'edit']);
    Route::patch('/manage/custom-apps/update/{id}', [App\Http\Controllers\CustomAppsController::class, 'update']);
    Route::delete('/manage/custom-apps/delete/{id}', [App\Http\Controllers\CustomAppsController::class, 'destroy']);

    // Manage App Gallery routes
    Route::get('/manage/app-gallery', [App\Http\Controllers\AppGalleryController::class, 'index']);
    Route::get('/manage/app-gallery/category/create', [App\Http\Controllers\AppGalleryController::class, 'createCat']);
    Route::post('/manage/app-gallery/category/store', [App\Http\Controllers\AppGalleryController::class, 'storeCat']);
    Route::get('/manage/app-gallery/category/{unique}', [App\Http\Controllers\AppGalleryController::class, 'showCat']);
    Route::get('/manage/app-gallery/category/edit/{unique}', [App\Http\Controllers\AppGalleryController::class, 'editCat']);
    Route::patch('/manage/app-gallery/category/update/{id}', [App\Http\Controllers\AppGalleryController::class, 'updateCat']);
    Route::post('/manage/app-gallery/category/update-apps/{id}', [App\Http\Controllers\AppsController::class, 'updateCategoryApps']);
    Route::delete('/manage/app-gallery/category/delete/{id}', [App\Http\Controllers\AppGalleryController::class, 'destroyCat']);

    // Manage Folder routes
    Route::get('/manage/folders', [App\Http\Controllers\FoldersController::class, 'index']);
    Route::get('/manage/folder/create', [App\Http\Controllers\FoldersController::class, 'create']);
    Route::post('/manage/folders/store', [App\Http\Controllers\FoldersController::class, 'store']);
    Route::get('/manage/folders/view/{id}', [App\Http\Controllers\FoldersController::class, 'show']);
    Route::delete('/manage/folders/delete/{id}', [App\Http\Controllers\FoldersController::class, 'delete']);

    // Manage Profile routes
    Route::get('/manage/profile/{id}/edit', [App\Http\Controllers\ProfileController::class, 'edit']);
    Route::patch('/manage/profile/{id}', [App\Http\Controllers\ProfileController::class, 'update']);

    // Manage Template routes
    Route::get('/manage/templates', [App\Http\Controllers\TemplatesController::class, 'index']);
    Route::get('/manage/template/create', [App\Http\Controllers\TemplatesController::class, 'create']);
    Route::get('/manage/template/edit/{unique}', [App\Http\Controllers\TemplatesController::class, 'edit']);
    Route::patch('/manage/template/update/{unique}', [App\Http\Controllers\TemplatesController::class, 'update']);
    Route::post('/manage/template/store', [App\Http\Controllers\TemplatesController::class, 'store']);

    // Manage Account, Settings, QuickDataViewer routes
    Route::get('/manage/accounts', [App\Http\Controllers\AccountController::class, 'index']);
    Route::get('/manage/settings', [App\Http\Controllers\SettingsController::class, 'index']);

});
// Public routes

Route::get('/app-gallery/overzicht', [App\Http\Controllers\AppGalleryController::class, 'GKB_AppGallery_Container']);

Route::get('/app-gallery/{cat_uniqid}', [App\Http\Controllers\AppGalleryController::class, 'GKB_AppGallery_CatContainer']);

Route::get('/apps/view/{unique}', [App\Http\Controllers\AppsController::class, 'show']);

Route::get('/manage/quickdataviewer', [App\Http\Controllers\QuickDataViewerController::class, 'index']);


// ArcGIS OAuth routes
Route::get('/arcgis/loginAGOL', function () {
    $portal = rtrim(config('services.arcgis.portal'), '/');

    return redirect(
        $portal . '/sharing/oauth2/authorize?' . http_build_query([
            'client_id'     => config('services.arcgis.client_id'),
            'response_type' => 'code',
            'redirect_uri'  => config('services.arcgis.redirect_uri'),
        ])
    );
})->name('arcgis.loginAGOL');
// AI routes (require auth + rate limiting)
Route::middleware(['auth', 'arcgis.required'])->group(function () {
    Route::get('/testAI', [App\Http\Controllers\AIController::class, 'index'])->name('testAI');
    Route::post('/logoutAGOL', [LogoutAGOLController::class, 'logout'])->name('logoutAGOL');
});

Route::get('/oauth-callback', [App\Http\Controllers\AIController::class, 'callback']);


Route::middleware(['auth', 'throttle:10,1'])->group(function () {
    Route::post('/ai/nl2where', [App\Http\Controllers\AIController::class, 'nl2where'])->name('ai.nl2where');
    Route::get('/ai/nl2where-stream', [App\Http\Controllers\AIController::class, 'nl2whereStream']);
});
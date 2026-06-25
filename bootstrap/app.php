<?php
use App\Http\Middleware\RequireArcgisLogin;
use App\Http\Middleware\SetVisitorIdCookie;
use App\Http\Middleware\TrackPageVisit;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
         $middleware->web(append: [
                SetVisitorIdCookie::class,
        ]);
    
        $middleware->alias([
            'arcgis.required' => RequireArcgisLogin::class,
            'track.visit' => TrackPageVisit::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Catch database connection failures and show a user-friendly page
        $dbConnectionHandler = function (\Throwable $e) {
            $msg = $e->getMessage();
            $code = (string) $e->getCode();
            $isConnectionError = str_contains($code, '2002')
                || str_contains($msg, '2002')
                || str_contains($msg, 'Connection refused')
                || str_contains($msg, 'SQLSTATE[HY000]');

            if ($isConnectionError) {
                return response()->view('errors.db-connection', [], 503);
            }
        };

        $exceptions->render(function (\Illuminate\Database\QueryException $e) use ($dbConnectionHandler) {
            return $dbConnectionHandler($e);
        });

        $exceptions->render(function (\PDOException $e) use ($dbConnectionHandler) {
            return $dbConnectionHandler($e);
        });
    })->create();

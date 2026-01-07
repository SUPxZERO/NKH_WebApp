<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Trust all proxies (for Render.com HTTPS support)
        $middleware->trustProxies(at: '*');
        
        $middleware->encryptCookies(except: [
            'table_session',
        ]);

        // Web middleware - Telegram auth MUST run before Authenticate
        $middleware->web(prepend: [
            \App\Http\Middleware\TelegramWebAppAuth::class, // Sprint P15: MUST run before auth
        ]);
        
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        // API middleware - enable session-based auth (same as web)
        // This allows API routes to share the session with web routes
        $middleware->api(prepend: [
            \App\Http\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
            \App\Http\Middleware\TelegramWebAppAuth::class, // Sprint P15: Auto-auth Telegram users for API
        ]);

        // Middleware aliases
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'payment.rate' => \App\Http\Middleware\PaymentRateLimiter::class,
            'throttle.api' => \App\Http\Middleware\GlobalApiRateLimiter::class,
            'account.lockout' => \App\Http\Middleware\AccountLockout::class,
            'permission' => \App\Http\Middleware\PermissionMiddleware::class,
            'mfa.verify' => \App\Http\Middleware\VerifyMfa::class,
            'debug.permissions' => \App\Http\Middleware\DebugPermissions::class,
            'telegram.api' => \App\Http\Middleware\TelegramAuth::class,
            'telegram.webapp' => \App\Http\Middleware\TelegramWebAppAuth::class,
            'auth.customer' => \App\Http\Middleware\CustomerApiAuth::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Consistent JSON error contracts for API requests
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => __('validation.failed'),
                    'errors' => $e->errors(),
                ], 422);
            }
        });

        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                ], 401);
            }
        });

        $exceptions->render(function (\Illuminate\Auth\Access\AuthorizationException $e, $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Forbidden.',
                ], 403);
            }
        });

        $exceptions->render(function (\Illuminate\Database\Eloquent\ModelNotFoundException $e, $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Resource not found.',
                ], 404);
            }
        });

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\HttpExceptionInterface $e, $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                $status = $e->getStatusCode();
                return response()->json([
                    'message' => $e->getMessage() ?: 'HTTP error.',
                ], $status);
            }
        });
    })->create();

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCustomerAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Allow if standard authenticated user
        if ($request->user()) {
            return $next($request);
        }

        // 2. Allow if valid Telegram Guest session
        // (Set by TelegramWebAppController::establishSession)
        if (session('telegram_guest') === true && session('telegram_user_id')) {
            return $next($request);
        }

        // 3. Otherwise, redirect to login
        // If it's an API request (expects JSON), return 401
        if ($request->expectsJson()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return redirect()->route('login');
    }
}

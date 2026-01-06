<?php

namespace App\Http\Middleware;

use App\Models\TelegramUser;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to ensure customer access for web routes.
 * Supports both standard auth and Telegram guest sessions.
 * 
 * Detection methods (in order):
 * 1. Standard Laravel authentication
 * 2. telegram_guest session flag
 * 3. telegram_webapp or telegram_user_id session flags
 * 4. X-Telegram-User-Id header (for iframe cookie issues)
 * 5. telegram_user_id query parameter (for direct links)
 */
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

        // 2. Allow if valid Telegram Guest session (fully established)
        if (session('telegram_guest') === true && session('telegram_user_id')) {
            return $next($request);
        }

        // 3. Allow if any Telegram webapp context (including pending)
        if (session('telegram_webapp') || session('telegram_user_id')) {
            return $next($request);
        }

        // 4. Check X-Telegram-User-Id header (fallback for iframe cookie issues)
        $telegramUserId = $request->header('X-Telegram-User-Id');
        if ($telegramUserId) {
            $telegramUser = TelegramUser::where('telegram_id', $telegramUserId)->first();
            if ($telegramUser && $telegramUser->is_active) {
                // Establish session for this request and future requests
                session([
                    'telegram_user_id' => $telegramUserId,
                    'telegram_webapp' => true,
                    'telegram_guest' => true,
                    'telegram_user' => [
                        'id' => $telegramUser->id,
                        'telegram_id' => $telegramUser->telegram_id,
                        'first_name' => $telegramUser->first_name,
                        'customer_id' => $telegramUser->customer_id,
                    ],
                ]);
                return $next($request);
            }
        }

        // 5. Check telegram_user_id query parameter (for direct links from Telegram)
        $telegramUserIdParam = $request->query('telegram_user_id');
        if ($telegramUserIdParam) {
            $telegramUser = TelegramUser::where('telegram_id', $telegramUserIdParam)->first();
            if ($telegramUser && $telegramUser->is_active) {
                // Establish session
                session([
                    'telegram_user_id' => $telegramUserIdParam,
                    'telegram_webapp' => true,
                    'telegram_guest' => true,
                    'telegram_user' => [
                        'id' => $telegramUser->id,
                        'telegram_id' => $telegramUser->telegram_id,
                        'first_name' => $telegramUser->first_name,
                        'customer_id' => $telegramUser->customer_id,
                    ],
                ]);
                return $next($request);
            }
        }

        // 6. Check for Telegram referer (user navigating within webapp)
        $referer = $request->header('Referer');
        if ($referer && (
            str_contains($referer, 'telegram.org') ||
            str_contains($referer, 't.me') ||
            str_contains($referer, 'tgWebAppPlatform')
        )) {
            // Allow navigation within Telegram context even without full session
            // The frontend should call /api/telegram-webapp/init to establish proper session
            session(['telegram_webapp' => true, 'telegram_pending' => true]);
            return $next($request);
        }

        // 7. Check tgWebAppPlatform query param (Telegram adds this)
        if ($request->query('tgWebAppPlatform')) {
            session(['telegram_webapp' => true, 'telegram_pending' => true]);
            return $next($request);
        }

        // 8. Otherwise, redirect to login
        // If it's an API request (expects JSON), return 401
        if ($request->expectsJson()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return redirect()->route('login');
    }
}


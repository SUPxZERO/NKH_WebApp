<?php

namespace App\Http\Middleware;

use App\Models\TelegramUser;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Combined authentication middleware for Customer API routes
 * 
 * Allows either:
 * 1. Standard Sanctum authentication (token or session)
 * 2. Telegram guest session authentication
 * 3. Any Telegram webapp context
 * 4. X-Telegram-User-Id header (for iframe context where cookies fail)
 * 
 * Use on customer API routes: 'auth.customer'
 */
class CustomerApiAuth
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check 1: Already authenticated via Laravel (Sanctum/Session)
        if (Auth::check()) {
            return $next($request);
        }

        // Check 2: Telegram guest session (fully established)
        if (TelegramWebAppAuth::isTelegramGuest()) {
            return $next($request);
        }

        // Check 3: Any Telegram webapp context (including pending)
        if (session('telegram_webapp') || session('telegram_guest') || session('telegram_user_id')) {
            return $next($request);
        }

        // Check 4: X-Telegram-User-Id header (fallback for iframe cookie issues)
        $telegramUserId = $request->header('X-Telegram-User-Id');
        if ($telegramUserId) {
            $telegramUser = TelegramUser::where('telegram_id', $telegramUserId)->first();
            if ($telegramUser && $telegramUser->is_active) {
                // Store in session for this request
                session(['telegram_user_id' => $telegramUserId]);
                session(['telegram_webapp' => true]);
                session(['telegram_guest' => true]);
                session(['telegram_user' => [
                    'id' => $telegramUser->id,
                    'telegram_id' => $telegramUser->telegram_id,
                    'first_name' => $telegramUser->first_name,
                ]]);
                return $next($request);
            }
        }

        // Check 5: Try Sanctum authentication (for API tokens)
        if ($request->bearerToken()) {
            try {
                Auth::shouldUse('sanctum');
                $user = Auth::user();
                if ($user) {
                    return $next($request);
                }
            } catch (\Exception $e) {
                // Sanctum auth failed, continue to rejection
            }
        }

        // No valid authentication
        return response()->json([
            'message' => 'Unauthenticated.',
            'error' => 'Authentication required. Please login or access via Telegram.',
        ], 401);
    }
}



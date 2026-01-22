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

        // ==========================================================================
        // SECURITY: Unauthenticated bypass vectors REMOVED
        // The following authentication methods were removed as they allowed
        // complete account takeover by forging easily-spoofable data:
        // - X-Telegram-User-Id header (trivially forged)
        // - telegram_user_id query parameter (trivially forged)
        // - Referer header checking (trivially forged)
        // - tgWebAppPlatform query parameter (trivially forged)
        //
        // Telegram authentication must use cryptographically verified initData
        // from TelegramWebAppAuth middleware which validates HMAC signatures.
        // See: https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
        // ==========================================================================

        // 8. Check for active Table Session (QR Code Guest)
        $tableSessionToken = $request->header('X-Table-Session')
            ?? $request->cookie('table_session')
            ?? $request->query('session_token');

        if ($tableSessionToken) {
            \Log::info('🔍 EnsureCustomerAccess: Checking Table Session Token', ['token' => $tableSessionToken]);
            $tableSession = \App\Models\TableSession::findByToken($tableSessionToken);

            if ($tableSession) {
                \Log::info('✅ EnsureCustomerAccess: Valid Session Found', ['id' => $tableSession->id]);
                // Determine user context (Customer or Guest) from session
                if ($tableSession->customer_id) {
                    // If session is linked to a customer, we might want to log them in or specific handling
                    // But for now, just allowing access is sufficient as the frontend expects
                }

                // Explicitly attach session to request for controller usage (optimization)
                $request->attributes->set('table_session', $tableSession);

                return $next($request);
            } else {
                \Log::warning('⚠️ EnsureCustomerAccess: Token Invalid or Expired', ['token' => $tableSessionToken]);
            }
        } else {
            // Only log if we are about to fail content-type json requests to avoid spamming logs for standard web access
            if ($request->expectsJson() && !$request->is('api/user') && !$request->user()) {
                \Log::info('ℹ️ EnsureCustomerAccess: No Auth, No Table Token', ['headers' => $request->headers->all()]);
            }
        }

        // 8. Otherwise, redirect to login
        // If it's an API request (expects JSON), return 401
        if ($request->expectsJson()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return redirect()->route('login');
    }
}


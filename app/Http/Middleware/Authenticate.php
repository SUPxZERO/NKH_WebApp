<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Handle an incoming request - allow Telegram users through.
     */
    protected function authenticate($request, array $guards)
    {
        // Check for Telegram guest session (fully authenticated)
        if (TelegramWebAppAuth::isTelegramGuest()) {
            return; // Allow through without authentication
        }

        // Check for pending Telegram session (detected but needs frontend init)
        // Allow through so React can call /api/telegram-webapp/init
        if (TelegramWebAppAuth::isTelegramPending()) {
            return; // Allow through - will be upgraded by frontend
        }

        // Check if this looks like a Telegram request (session flag exists)
        if (session('telegram_webapp')) {
            return; // Allow through for Telegram context
        }

        // Default authentication behavior
        parent::authenticate($request, $guards);
    }

    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        // If it's any Telegram context, don't redirect to login
        if (session('telegram_webapp') || session('telegram_guest') || session('telegram_pending')) {
            return null;
        }

        // Check for Telegram query params
        if ($request->query('tgWebAppPlatform') || $request->query('telegram_user_id')) {
            return null;
        }
        
        return $request->expectsJson() ? null : route('login');
    }
}


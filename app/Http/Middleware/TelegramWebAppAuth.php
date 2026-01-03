<?php

namespace App\Http\Middleware;

use App\Models\TelegramUser;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware for Telegram WebApp authentication
 * 
 * This middleware detects if the request is coming from a Telegram Mini App
 * and sets up a special session that allows guest access to customer pages.
 * 
 * Detection methods:
 * 1. Query param: tgWebAppPlatform (added by Telegram)
 * 2. HTTP Referer containing telegram.org
 * 3. Session flag from previous Telegram access
 * 4. Direct telegram_user_id query param
 */
class TelegramWebAppAuth
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip if already authenticated via Laravel
        if (Auth::check()) {
            return $next($request);
        }

        // Check if we already have a Telegram session
        if (session('telegram_guest') === true && session('telegram_user_id')) {
            Log::debug('TelegramWebAppAuth: Existing session found');
            return $next($request);
        }

        // Detect if this request is from Telegram Mini App
        $isTelegramRequest = $this->isTelegramRequest($request);
        
        if ($isTelegramRequest) {
            Log::info('TelegramWebAppAuth: Telegram request detected', [
                'platform' => $request->query('tgWebAppPlatform'),
                'referer' => $request->header('Referer'),
            ]);
            
            // Create a pending Telegram session
            // This will be upgraded when frontend calls /api/telegram-webapp/init
            session([
                'telegram_webapp' => true,
                'telegram_pending' => true, // Not fully authenticated yet
            ]);
            
            // Try to get telegram_user_id from query (for direct links)
            $telegramUserId = $request->query('telegram_user_id');
            if ($telegramUserId) {
                $authenticated = $this->authenticateTelegramUser((int) $telegramUserId);
                if ($authenticated) {
                    session(['telegram_pending' => false]);
                }
            }
            
            return $next($request);
        }

        // Not a Telegram request - continue normally
        return $next($request);
    }

    /**
     * Detect if request is from Telegram Mini App
     */
    private function isTelegramRequest(Request $request): bool
    {
        // Method 1: tgWebAppPlatform query param (Telegram adds this)
        if ($request->query('tgWebAppPlatform')) {
            return true;
        }
        
        // Method 2: tgWebAppStartParam query param
        if ($request->query('tgWebAppStartParam')) {
            return true;
        }
        
        // Method 3: HTTP Referer from Telegram
        $referer = $request->header('Referer', '');
        if (str_contains($referer, 'telegram.org') || str_contains($referer, 't.me')) {
            return true;
        }
        
        // Method 4: User-Agent containing Telegram
        $userAgent = $request->header('User-Agent', '');
        if (str_contains($userAgent, 'Telegram') || str_contains($userAgent, 'TelegramBot')) {
            return true;
        }
        
        // Method 5: Already has telegram_webapp session
        if (session('telegram_webapp')) {
            return true;
        }

        return false;
    }

    /**
     * Authenticate a Telegram user for web access
     */
    private function authenticateTelegramUser(int $telegramId): bool
    {
        // Find or create TelegramUser
        $telegramUser = TelegramUser::where('telegram_id', $telegramId)->first();
        
        if (!$telegramUser) {
            // Auto-create for new users
            $telegramUser = TelegramUser::create([
                'telegram_id' => $telegramId,
                'first_name' => 'Guest',
                'is_active' => true,
            ]);
            Log::info('TelegramWebAppAuth: Auto-created TelegramUser', ['telegram_id' => $telegramId]);
        }

        if (!$telegramUser->is_active) {
            Log::debug('TelegramWebAppAuth: TelegramUser is inactive', ['telegram_id' => $telegramId]);
            return false;
        }

        // If the telegram user has a linked customer account, authenticate that user
        if ($telegramUser->customer_id && $telegramUser->customer?->user) {
            Auth::login($telegramUser->customer->user);
            Log::info('TelegramWebAppAuth: Authenticated linked user', [
                'user_id' => $telegramUser->customer->user->id,
                'telegram_id' => $telegramId,
            ]);
            return true;
        }

        // For guest telegram users (no linked account), create guest session
        session([
            'telegram_guest' => true,
            'telegram_user_id' => $telegramId,
            'telegram_webapp' => true,
            'telegram_pending' => false,
            'telegram_user' => [
                'id' => $telegramUser->id,
                'telegram_id' => $telegramUser->telegram_id,
                'first_name' => $telegramUser->first_name,
                'last_name' => $telegramUser->last_name,
                'username' => $telegramUser->telegram_username,
            ],
        ]);

        Log::info('TelegramWebAppAuth: Created guest session', ['telegram_id' => $telegramId]);
        return true;
    }

    /**
     * Check if current request is from a Telegram guest (not logged in but has telegram session)
     */
    public static function isTelegramGuest(): bool
    {
        return session('telegram_guest') === true && !Auth::check();
    }

    /**
     * Check if this is a pending Telegram session (detected but not authenticated yet)
     */
    public static function isTelegramPending(): bool
    {
        return session('telegram_webapp') === true && session('telegram_pending') === true;
    }

    /**
     * Get stored Telegram user data from session
     */
    public static function getTelegramUser(): ?array
    {
        return session('telegram_user');
    }
}


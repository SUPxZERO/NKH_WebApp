<?php

namespace App\Http\Traits;

use App\Models\Customer;
use App\Models\TelegramUser;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Trait for controllers that need to handle both standard Laravel auth
 * and Telegram Mini App guest sessions.
 * 
 * Use this trait in controllers that serve customer API endpoints
 * to ensure they work for both logged-in users and Telegram guests.
 */
trait TelegramAwareAuth
{
    /**
     * Get the authenticated user or Telegram user data.
     * 
     * Returns:
     * - User model if authenticated via Laravel
     * - Array with Telegram user data if Telegram guest
     * - null if no authentication
     */
    protected function getAuthenticatedUserOrTelegram(Request $request): User|array|null
    {
        // 1. Standard Laravel authentication
        if ($request->user()) {
            return $request->user();
        }

        // 2. Telegram session
        $telegramData = session('telegram_user');
        if ($telegramData && session('telegram_guest') === true) {
            return $telegramData;
        }

        // 3. X-Telegram-User-Id header fallback
        $telegramUserId = $request->header('X-Telegram-User-Id');
        if ($telegramUserId) {
            $telegramUser = TelegramUser::where('telegram_id', $telegramUserId)->first();
            if ($telegramUser && $telegramUser->is_active) {
                return [
                    'id' => $telegramUser->id,
                    'telegram_id' => $telegramUser->telegram_id,
                    'first_name' => $telegramUser->first_name,
                    'customer_id' => $telegramUser->customer_id,
                ];
            }
        }

        return null;
    }

    /**
     * Check if the current request is from a Telegram guest (not a Laravel user).
     */
    protected function isTelegramGuest(Request $request): bool
    {
        return !$request->user() && (
            session('telegram_guest') === true ||
            $request->header('X-Telegram-User-Id')
        );
    }

    /**
     * Get the current customer from auth or Telegram session.
     * 
     * @return Customer|null
     */
    protected function getCurrentCustomer(Request $request): ?Customer
    {
        // 1. Standard Auth - get customer from User relationship
        if ($request->user()) {
            return $request->user()->customer;
        }

        // 2. Telegram Session (set by TelegramWebAppAuth middleware)
        $telegramData = session('telegram_user');
        if ($telegramData && isset($telegramData['customer_id'])) {
            return Customer::find($telegramData['customer_id']);
        }

        // 3. X-Telegram-User-Id header fallback
        $telegramUserId = $request->header('X-Telegram-User-Id');
        if ($telegramUserId) {
            $telegramUser = TelegramUser::where('telegram_id', $telegramUserId)->first();
            if ($telegramUser && $telegramUser->customer_id) {
                return Customer::find($telegramUser->customer_id);
            }
        }

        return null;
    }

    /**
     * Get the Telegram user model if this is a Telegram session.
     */
    protected function getTelegramUser(Request $request): ?TelegramUser
    {
        // From session
        $telegramData = session('telegram_user');
        if ($telegramData && isset($telegramData['telegram_id'])) {
            return TelegramUser::where('telegram_id', $telegramData['telegram_id'])->first();
        }

        // From session telegram_user_id
        $telegramId = session('telegram_user_id');
        if ($telegramId) {
            return TelegramUser::where('telegram_id', $telegramId)->first();
        }

        // From header
        $telegramUserId = $request->header('X-Telegram-User-Id');
        if ($telegramUserId) {
            return TelegramUser::where('telegram_id', $telegramUserId)->first();
        }

        return null;
    }

    /**
     * Get a user ID suitable for storing in database relations.
     * 
     * For Telegram guests, this returns a pseudo-ID based on their customer_id
     * to maintain compatibility with user_id foreign keys.
     * 
     * Note: This should only be used for features that truly need a user_id.
     * Prefer using customer_id where possible.
     */
    protected function getUserIdForStorage(Request $request): ?int
    {
        // 1. Standard auth - use actual user ID
        if ($request->user()) {
            return $request->user()->id;
        }

        // 2. Telegram guest - check if they have a linked User account
        $customer = $this->getCurrentCustomer($request);
        if ($customer && $customer->user_id) {
            return $customer->user_id;
        }

        // 3. No user ID available for pure Telegram guests
        return null;
    }

    /**
     * Get customer ID for the current session (works for both auth types).
     */
    protected function getCustomerId(Request $request): ?int
    {
        $customer = $this->getCurrentCustomer($request);
        return $customer?->id;
    }

    /**
     * Get both customer and telegram user in one go.
     * Useful for destructuring: [$customer, $telegramUser, $error] = $this->getCustomerOrTelegram($request);
     * 
     * @return array{0: ?Customer, 1: ?TelegramUser, 2: ?string}
     */
    protected function getCustomerOrTelegram(Request $request): array
    {
        $customer = $this->getCurrentCustomer($request);
        $telegramUser = $this->getTelegramUser($request);
        
        $error = null;
        if (!$customer && !$telegramUser) {
            $error = 'Profile not found. Please ensure you are logged in properly.';
        }

        return [$customer, $telegramUser, $error];
    }
}

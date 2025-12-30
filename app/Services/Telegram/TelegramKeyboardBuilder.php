<?php

namespace App\Services\Telegram;

class TelegramKeyboardBuilder
{
    /**
     * Create inline keyboard
     */
    public static function inlineKeyboard(array $buttons): array
    {
        return [
            'inline_keyboard' => $buttons,
        ];
    }

    /**
     * Build main simplified menu
     */
    public static function mainMenu(): array
    {
        return self::inlineKeyboard([
            [
                ['text' => '🍔 Order Now', 'web_app' => ['url' => config('app.url')]],
            ],
            [
                ['text' => 'ℹ️ Help & Locations', 'callback_data' => 'help_info'],
                ['text' => '🔔 Check Status', 'callback_data' => 'check_status'],
            ],
        ]);
    }

    /**
     * Build order status keyboard for notifications
     * Retained for notification service compatibility
     */
    public static function buildOrderStatusKeyboard(int $orderId): array
    {
        // Simply point them to the website
        return self::inlineKeyboard([
            [
                ['text' => '🔍 View Order Details', 'web_app' => ['url' => config('app.url') . "/orders/{$orderId}"]],
            ],
        ]);
    }
    
    /**
     * Build order completed keyboard
     * Retained for notification service compatibility
     */
    public static function buildOrderCompletedKeyboard(int $orderId): array
    {
         return self::inlineKeyboard([
            [
                ['text' => '⭐ Rate & Reorder', 'web_app' => ['url' => config('app.url') . "/orders/{$orderId}"]],
            ],
        ]);
    }
}

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
     * 
     * @param int|null $telegramUserId Optional Telegram user ID for WebApp session continuity
     */
    public static function mainMenu(?int $telegramUserId = null): array
    {
        // Build menu URL with telegram_user_id for session continuity
        // This allows middleware to authenticate the user immediately when WebApp opens
        $menuUrl = config('app.url') . '/menu';
        if ($telegramUserId) {
            $menuUrl .= '?telegram_user_id=' . $telegramUserId;
        }
        
        return self::inlineKeyboard([
            [
                ['text' => '🍔 Order Now', 'web_app' => ['url' => $menuUrl]],
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

    /**
     * Build track order keyboard
     */
    public static function buildTrackOrderKeyboard(int $orderId): array
    {
        return self::inlineKeyboard([
            [
                ['text' => '📦 Track Order', 'web_app' => ['url' => config('app.url') . "/orders/{$orderId}"]],
            ],
        ]);
    }

    /**
     * Build main menu keyboard (for returning to main menu)
     * 
     * @param int|null $telegramUserId Optional Telegram user ID for WebApp session continuity
     */
    public static function buildMainMenuKeyboard(?int $telegramUserId = null): array
    {
        return self::mainMenu($telegramUserId);
    }

    /**
     * Build notification preference keyboard
     */
    public static function buildNotificationPreferenceKeyboard(): array
    {
        return self::inlineKeyboard([
            [
                ['text' => '✅ Enable Notifications', 'callback_data' => 'notif_enable'],
                ['text' => '❌ Disable', 'callback_data' => 'notif_disable'],
            ],
        ]);
    }

    // ==================== GUEST CHECKOUT KEYBOARDS ====================

    /**
     * Build order type selection keyboard (pickup/delivery)
     */
    public static function orderTypeSelection(): array
    {
        return self::inlineKeyboard([
            [
                ['text' => '🏪 Pickup', 'callback_data' => 'checkout_type_pickup'],
                ['text' => '🚗 Delivery', 'callback_data' => 'checkout_type_delivery'],
            ],
            [
                ['text' => '❌ Cancel', 'callback_data' => 'checkout_cancel'],
            ],
        ]);
    }

    /**
     * Build location selection keyboard
     */
    public static function locationSelection(array $locations): array
    {
        $buttons = [];
        foreach ($locations as $location) {
            $buttons[] = [
                ['text' => "📍 {$location['name']}", 'callback_data' => "checkout_loc_{$location['id']}"],
            ];
        }
        $buttons[] = [
            ['text' => '◀️ Back', 'callback_data' => 'checkout_back_type'],
        ];
        return self::inlineKeyboard($buttons);
    }

    /**
     * Build contact info request keyboard (for delivery)
     */
    public static function contactInfoRequest(bool $hasPhone = false, bool $hasAddress = false): array
    {
        $buttons = [];
        
        if (!$hasPhone) {
            $buttons[] = [
                ['text' => '📞 Share Phone Number', 'callback_data' => 'checkout_share_phone'],
            ];
        }
        
        if (!$hasAddress) {
            $buttons[] = [
                ['text' => '📍 Enter Delivery Address', 'callback_data' => 'checkout_enter_address'],
            ];
        }
        
        if ($hasPhone && $hasAddress) {
            $buttons[] = [
                ['text' => '✅ Continue to Checkout', 'callback_data' => 'checkout_continue'],
            ];
        }
        
        $buttons[] = [
            ['text' => '◀️ Back', 'callback_data' => 'checkout_back_location'],
        ];
        
        return self::inlineKeyboard($buttons);
    }

    /**
     * Build guest checkout confirmation keyboard
     */
    public static function guestCheckoutConfirmation(): array
    {
        return self::inlineKeyboard([
            [
                ['text' => '✅ Confirm Order', 'callback_data' => 'checkout_confirm'],
            ],
            [
                ['text' => '✏️ Edit Cart', 'callback_data' => 'checkout_edit_cart'],
                ['text' => '❌ Cancel', 'callback_data' => 'checkout_cancel'],
            ],
        ]);
    }

    /**
     * Build payment mode selection keyboard
     */
    public static function paymentModeSelection(string $orderType): array
    {
        $modes = [];
        
        $modes[] = [
            ['text' => '💳 Pay Now (Online)', 'callback_data' => 'checkout_pay_now'],
        ];
        
        if ($orderType === 'delivery') {
            $modes[] = [
                ['text' => '💵 Pay on Delivery', 'callback_data' => 'checkout_pay_on_delivery'],
            ];
        } elseif ($orderType === 'pickup') {
            $modes[] = [
                ['text' => '💵 Pay on Pickup', 'callback_data' => 'checkout_pay_on_pickup'],
            ];
        }
        
        $modes[] = [
            ['text' => '◀️ Back', 'callback_data' => 'checkout_back_contact'],
        ];
        
        return self::inlineKeyboard($modes);
    }

    /**
     * Build order success keyboard
     */
    public static function orderSuccessKeyboard(int $orderId): array
    {
        return self::inlineKeyboard([
            [
                ['text' => '📦 View Order', 'web_app' => ['url' => config('app.url') . "/orders/{$orderId}"]],
            ],
            [
                ['text' => '🍔 Order More', 'web_app' => ['url' => config('app.url') . '/menu']],
            ],
        ]);
    }

    /**
     * Build skip account linking keyboard (continue as guest)
     */
    public static function skipAccountLinking(): array
    {
        return self::inlineKeyboard([
            [
                ['text' => '👤 Link Account (Get Rewards)', 'callback_data' => 'link_account'],
            ],
            [
                ['text' => '➡️ Continue as Guest', 'callback_data' => 'continue_guest'],
            ],
        ]);
    }

    /**
     * SPRINT P16: Build phone request keyboard using Telegram's native request_contact
     * 
     * This uses a ReplyKeyboard (not InlineKeyboard) with request_contact: true
     * to get verified phone number directly from Telegram.
     */
    public static function requestPhoneContact(): array
    {
        return [
            'keyboard' => [
                [['text' => '📱 Share My Phone Number', 'request_contact' => true]],
                [['text' => '⏭️ Skip for Now']],
            ],
            'resize_keyboard' => true,
            'one_time_keyboard' => true,
        ];
    }

    /**
     * SPRINT P16: Build welcome keyboard with setup options
     * Encourages phone sharing for better experience
     * 
     * @param bool $hasPhone Whether user has shared phone
     * @param int|null $telegramUserId Optional Telegram user ID for WebApp session continuity
     */
    public static function welcomeWithSetup(bool $hasPhone = false, ?int $telegramUserId = null): array
    {
        if ($hasPhone) {
            return self::mainMenu($telegramUserId);
        }

        // Show phone request for first-time users
        return [
            'keyboard' => [
                [['text' => '📱 Share Phone for Order Updates', 'request_contact' => true]],
                [['text' => '🍔 Start Ordering']],
            ],
            'resize_keyboard' => true,
            'one_time_keyboard' => true,
        ];
    }
}


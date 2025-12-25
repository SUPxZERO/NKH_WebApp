<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Telegram Bot Configuration
    |--------------------------------------------------------------------------
    |
    | Configure your Telegram bot settings here. You can also set these
    | in your .env file using the TELEGRAM_ prefix.
    |
    */

    // Bot Token from @BotFather
    'bot_token' => env('TELEGRAM_BOT_TOKEN', ''),

    // Secret token for webhook verification (set this to a random string)
    // Telegram will send this in the X-Telegram-Bot-Api-Secret-Token header
    'secret_token' => env('TELEGRAM_WEBHOOK_SECRET', ''),

    // Webhook URL (should be publicly accessible)
    'webhook_url' => env('TELEGRAM_WEBHOOK_URL', ''),

    // Bot username (optional, for display purposes)
    'bot_username' => env('TELEGRAM_BOT_USERNAME', ''),

    /*
    |--------------------------------------------------------------------------
    | Feature Settings
    |--------------------------------------------------------------------------
    */

    // Enable/disable notifications
    'notifications_enabled' => env('TELEGRAM_NOTIFICATIONS_ENABLED', true),

    // Cart settings
    'cart_expiry_minutes' => (int) env('TELEGRAM_CART_EXPIRY_MINUTES', 60),
    'max_cart_items' => (int) env('TELEGRAM_MAX_CART_ITEMS', 20),

    // Rate limiting for API endpoints
    'rate_limit' => [
        'max_requests' => (int) env('TELEGRAM_RATE_LIMIT_REQUESTS', 60),
        'decay_minutes' => (int) env('TELEGRAM_RATE_LIMIT_DECAY', 1),
    ],

    /*
    |--------------------------------------------------------------------------
    | Menu Display Settings
    |--------------------------------------------------------------------------
    */

    'menu' => [
        'items_per_page' => (int) env('TELEGRAM_MENU_ITEMS_PER_PAGE', 10),
        'show_images' => env('TELEGRAM_MENU_SHOW_IMAGES', true),
        'default_language' => env('TELEGRAM_DEFAULT_LANGUAGE', 'en'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Notification Settings
    |--------------------------------------------------------------------------
    */

    'notifications' => [
        // Order status notifications
        'order_placed' => env('TELEGRAM_NOTIFY_ORDER_PLACED', true),
        'order_approved' => env('TELEGRAM_NOTIFY_ORDER_APPROVED', true),
        'order_preparing' => env('TELEGRAM_NOTIFY_ORDER_PREPARING', true),
        'order_ready' => env('TELEGRAM_NOTIFY_ORDER_READY', true),
        'order_completed' => env('TELEGRAM_NOTIFY_ORDER_COMPLETED', true),
        'order_cancelled' => env('TELEGRAM_NOTIFY_ORDER_CANCELLED', true),

        // Marketing notifications
        'promotions' => env('TELEGRAM_NOTIFY_PROMOTIONS', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Development Settings
    |--------------------------------------------------------------------------
    */

    // Enable debug mode (logs more information)
    'debug' => env('TELEGRAM_DEBUG', false),

    // Use mock mode for testing without actual Telegram API calls
    'mock_mode' => env('TELEGRAM_MOCK_MODE', false),
];

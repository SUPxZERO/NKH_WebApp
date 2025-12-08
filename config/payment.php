<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Payment Gateway Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains all configuration for payment processing.
    |
    */

    // Payment expiry time in minutes
    'expiry_minutes' => env('PAYMENT_EXPIRY_MINUTES', 15),

    // Maximum retry attempts for failed payments
    'max_retries' => env('PAYMENT_MAX_RETRIES', 3),

    // Default currency
    'default_currency' => env('PAYMENT_DEFAULT_CURRENCY', 'USD'),

    // Supported currencies
    'supported_currencies' => ['USD', 'KHR'],

    // Exchange rate (KHR per USD)
    'exchange_rate' => env('PAYMENT_EXCHANGE_RATE', 4100),

    /*
    |--------------------------------------------------------------------------
    | QRKH Configuration (Cambodia QR Standard)
    |--------------------------------------------------------------------------
    */
    'qrkh' => [
        'enabled' => env('QRKH_ENABLED', true),
        'merchant_id' => env('QRKH_MERCHANT_ID', 'NKH001'),
        'merchant_name' => env('QRKH_MERCHANT_NAME', 'NKH Restaurant'),
        'merchant_city' => env('QRKH_MERCHANT_CITY', 'Phnom Penh'),
        'merchant_category_code' => '5812', // Restaurant/Eating places
    ],

    /*
    |--------------------------------------------------------------------------
    | ABA Bank Configuration
    |--------------------------------------------------------------------------
    */
    'aba' => [
        'enabled' => env('ABA_ENABLED', false),
        'merchant_id' => env('ABA_MERCHANT_ID', ''),
        'api_key' => env('ABA_API_KEY', ''),
        'api_secret' => env('ABA_API_SECRET', ''),
        'api_url' => env('ABA_API_URL', 'https://api.payway.com.kh'),
        'sandbox_mode' => env('ABA_SANDBOX_MODE', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Webhook Security
    |--------------------------------------------------------------------------
    */
    'webhook_secret' => env('PAYMENT_WEBHOOK_SECRET', ''),
    
    // IP addresses allowed to send webhooks (empty = allow all in development)
    'webhook_allowed_ips' => array_filter(explode(',', env('PAYMENT_WEBHOOK_IPS', ''))),

    /*
    |--------------------------------------------------------------------------
    | Fraud Prevention
    |--------------------------------------------------------------------------
    */
    'fraud' => [
        // Max orders per customer in 10 minutes
        'velocity_limit' => env('FRAUD_VELOCITY_LIMIT', 5),
        
        // Amount threshold requiring additional verification (USD)
        'high_value_threshold' => env('FRAUD_HIGH_VALUE_THRESHOLD', 500),
        
        // Maximum failed payment attempts before temporary block
        'max_failed_attempts' => env('FRAUD_MAX_FAILED_ATTEMPTS', 3),
        
        // Block duration in minutes
        'block_duration' => env('FRAUD_BLOCK_DURATION', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | Daily Settlement
    |--------------------------------------------------------------------------
    */
    'settlement' => [
        // Time to run daily settlement job (in 24h format)
        'time' => env('SETTLEMENT_TIME', '23:59'),
        
        // Auto-close settlements after X days
        'auto_close_days' => env('SETTLEMENT_AUTO_CLOSE_DAYS', 7),
    ],

    /*
    |--------------------------------------------------------------------------
    | Notification Settings
    |--------------------------------------------------------------------------
    */
    'notifications' => [
        // Email notifications for payments
        'email_enabled' => env('PAYMENT_EMAIL_NOTIFICATIONS', true),
        
        // Admin email for payment alerts
        'admin_email' => env('PAYMENT_ADMIN_EMAIL', ''),
        
        // Alert threshold for failed payments
        'failed_payment_alert_threshold' => env('PAYMENT_FAILED_ALERT_THRESHOLD', 10),
    ],
];

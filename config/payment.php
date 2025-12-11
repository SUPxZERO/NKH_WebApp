<?php

return [
    /*
    |--------------------------------------------------------------------------
    | KHQR Configuration (General)
    |--------------------------------------------------------------------------
    |
    | Standard KHQR settings used across all Bakong-compatible payment methods.
    |
    */
    'qrkh' => [
        'merchant_id' => env('KHQR_MERCHANT_ID', 'NKH001'),
        'merchant_name' => env('KHQR_MERCHANT_NAME', 'NKH Restaurant'),
        'merchant_city' => env('KHQR_MERCHANT_CITY', 'Phnom Penh'),
        'category_code' => env('KHQR_CATEGORY_CODE', '5812'), // Restaurant/Eating Places
    ],

    /*
    |--------------------------------------------------------------------------
    | Bakong API Configuration
    |--------------------------------------------------------------------------
    |
    | National Bank of Cambodia's Bakong API for KHQR payment notifications.
    | Register at: https://bakong.nbc.gov.kh/merchant
    |
    */
    'bakong' => [
        'enabled' => env('BAKONG_ENABLED', false),
        'api_url' => env('BAKONG_API_URL', 'https://api.bakong.nbc.gov.kh/v1'),
        'token' => env('BAKONG_TOKEN'),
        'email' => env('BAKONG_EMAIL'),
    ],

    /*
    |--------------------------------------------------------------------------
    | ABA Pay Configuration
    |--------------------------------------------------------------------------
    |
    | ABA Bank merchant settings. Contact ABA Bank for merchant registration.
    | Website: https://www.ababank.com/merchant
    |
    */
    'aba' => [
        'merchant_id' => env('ABA_MERCHANT_ID'),
        'merchant_name' => env('ABA_MERCHANT_NAME', 'NKH Restaurant'),
        'merchant_city' => env('ABA_MERCHANT_CITY', 'Phnom Penh'),
        'api_url' => env('ABA_API_URL', 'https://checkout.payway.com.kh/api'),
        'api_key' => env('ABA_API_KEY'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Wing Money Configuration
    |--------------------------------------------------------------------------
    |
    | Wing (Cambodia) Limited merchant settings.
    | Website: https://www.wingmoney.com/merchant
    |
    */
    'wing' => [
        'merchant_id' => env('WING_MERCHANT_ID'),
        'merchant_name' => env('WING_MERCHANT_NAME', 'NKH Restaurant'),
        'merchant_city' => env('WING_MERCHANT_CITY', 'Phnom Penh'),
        'api_url' => env('WING_API_URL'),
        'api_key' => env('WING_API_KEY'),
    ],

    /*
    |--------------------------------------------------------------------------
    | General Payment Settings
    |--------------------------------------------------------------------------
    */
    'default_currency' => env('PAYMENT_DEFAULT_CURRENCY', 'USD'),
    'supported_currencies' => ['USD', 'KHR'],
    'khr_exchange_rate' => env('PAYMENT_KHR_EXCHANGE_RATE', 4100), // USD to KHR
    
    // QR Code expiration in minutes
    'qr_expiration_minutes' => env('PAYMENT_QR_EXPIRATION_MINUTES', 15),
    
    // Webhook secret for verifying payment callbacks
    'webhook_secret' => env('PAYMENT_WEBHOOK_SECRET'),

    // Tax rate for receipts (percentage)
    'tax_rate' => env('PAYMENT_TAX_RATE', 10),

    /*
    |--------------------------------------------------------------------------
    | Receipt Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for receipt generation and email.
    |
    */
    'receipt' => [
        'address' => env('RECEIPT_ADDRESS', 'Phnom Penh, Cambodia'),
        'phone' => env('RECEIPT_PHONE', ''),
        'thank_you' => env('RECEIPT_THANK_YOU', 'Thank you for dining with us!'),
        'footer' => env('RECEIPT_FOOTER', 'Please come again'),
        
        // Auto-send email receipt on payment complete
        'auto_email' => env('RECEIPT_AUTO_EMAIL', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting Configuration
    |--------------------------------------------------------------------------
    |
    | Rate limits for different payment operations (attempts per decay window).
    |
    */
    'rate_limits' => [
        'initiate' => ['attempts' => 10, 'decay' => 60],     // 10 per minute
        'status' => ['attempts' => 60, 'decay' => 60],       // 60 per minute
        'webhook' => ['attempts' => 100, 'decay' => 60],     // 100 per minute
        'refund' => ['attempts' => 5, 'decay' => 60],        // 5 per minute
        'receipt' => ['attempts' => 30, 'decay' => 60],      // 30 per minute
    ],

    /*
    |--------------------------------------------------------------------------
    | Monitoring Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for payment monitoring and alerting.
    |
    */
    'monitoring' => [
        // Failure rate threshold to trigger alerts (percentage)
        'failure_threshold' => env('PAYMENT_FAILURE_THRESHOLD', 10),
        
        // Minimum payments before monitoring kicks in
        'min_payments_for_alert' => 10,
    ],

    /*
    |--------------------------------------------------------------------------
    | Security Configuration
    |--------------------------------------------------------------------------
    |
    | Security settings for payment processing.
    |
    */
    'security' => [
        // Enforce webhook signature verification (auto-enabled in production)
        'enforce_webhook_verification' => env('PAYMENT_ENFORCE_WEBHOOK_VERIFICATION', false),
        
        // Enable idempotency key checking
        'idempotency_enabled' => env('PAYMENT_IDEMPOTENCY_ENABLED', true),
        
        // Max payment age before considered suspicious (hours)
        'max_pending_age_hours' => 24,
    ],
];

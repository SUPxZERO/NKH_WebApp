<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Rate Limiting Configuration
    |--------------------------------------------------------------------------
    |
    | Tiered rate limiting based on endpoint sensitivity and user role.
    | Limits are defined as [max_attempts, decay_seconds].
    |
    */

    'tiers' => [
        // Authentication endpoints - strictest limits
        'auth' => [
            'limit' => env('RATE_LIMIT_AUTH', 5),
            'decay' => env('RATE_LIMIT_AUTH_DECAY', 60),
        ],

        // Sensitive operations (password reset, payment, etc.)
        'sensitive' => [
            'limit' => env('RATE_LIMIT_SENSITIVE', 20),
            'decay' => env('RATE_LIMIT_SENSITIVE_DECAY', 60),
        ],

        // General API endpoints
        'api' => [
            'limit' => env('RATE_LIMIT_API', 100),
            'decay' => env('RATE_LIMIT_API_DECAY', 60),
        ],

        // Admin operations
        'admin' => [
            'limit' => env('RATE_LIMIT_ADMIN', 200),
            'decay' => env('RATE_LIMIT_ADMIN_DECAY', 60),
        ],

        // Webhooks
        'webhook' => [
            'limit' => env('RATE_LIMIT_WEBHOOK', 50),
            'decay' => env('RATE_LIMIT_WEBHOOK_DECAY', 60),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Role-Based Rate Multipliers
    |--------------------------------------------------------------------------
    |
    | Users with certain roles can have their rate limits multiplied.
    |
    */

    'role_multipliers' => [
        'admin' => 3.0,      // Admins get 3x the limit
        'manager' => 2.0,    // Managers get 2x
        'employee' => 1.5,   // Employees get 1.5x
        'customer' => 1.0,   // Customers get base limit
    ],

    /*
    |--------------------------------------------------------------------------
    | Bypass Configuration
    |--------------------------------------------------------------------------
    |
    | IPs or user IDs that bypass rate limiting entirely.
    | Use with caution - primarily for trusted internal services.
    |
    */

    'bypass' => [
        'ips' => explode(',', env('RATE_LIMIT_BYPASS_IPS', '')),
        'user_ids' => array_map('intval', explode(',', env('RATE_LIMIT_BYPASS_USERS', ''))),
    ],

    /*
    |--------------------------------------------------------------------------
    | Response Headers
    |--------------------------------------------------------------------------
    |
    | Include rate limit information in response headers.
    |
    */

    'headers' => [
        'enabled' => true,
        'limit' => 'X-RateLimit-Limit',
        'remaining' => 'X-RateLimit-Remaining',
        'retry_after' => 'Retry-After',
    ],
];

<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default Geocoding Provider
    |--------------------------------------------------------------------------
    |
    | This option controls the default geocoding provider that will be used
    | to convert addresses to coordinates. Supported: "nominatim", "google", "mapbox"
    |
    */
    'default' => env('GEOCODING_PROVIDER', 'nominatim'),

    /*
    |--------------------------------------------------------------------------
    | Geocoding Providers
    |--------------------------------------------------------------------------
    |
    | Here you may configure as many geocoding providers as you wish.
    | Each provider has its own configuration and rate limiting rules.
    |
    */
    'providers' => [
        'nominatim' => [
            'url' => env('NOMINATIM_URL', 'https://nominatim.openstreetmap.org'),
            'rate_limit' => 1, // requests per second
            'user_agent' => env('APP_NAME', 'NKH Restaurant'),
            'language' => 'en',
            'timeout' => 10, // seconds
        ],

        'google' => [
            'api_key' => env('GOOGLE_MAPS_API_KEY'),
            'language' => 'en',
            'region' => 'KH', // Cambodia
            'timeout' => 10,
        ],

        'mapbox' => [
            'api_key' => env('MAPBOX_API_KEY'),
            'language' => 'en',
            'country' => 'KH', // Cambodia
            'timeout' => 10,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache Configuration
    |--------------------------------------------------------------------------
    |
    | Geocoding results are cached to minimize API calls and improve performance.
    | TTL is in seconds (default: 30 days).
    |
    */
    'cache' => [
        'enabled' => env('GEOCODING_CACHE_ENABLED', true),
        'ttl' => env('GEOCODING_CACHE_TTL', 2592000), // 30 days
        'prefix' => 'geocode:',
    ],

    /*
    |--------------------------------------------------------------------------
    | Fallback Configuration
    |--------------------------------------------------------------------------
    |
    | When the primary provider fails, these providers will be tried in order.
    |
    */
    'fallback_providers' => env('GEOCODING_FALLBACK', 'google,mapbox'),

    /*
    |--------------------------------------------------------------------------
    | Quality Thresholds
    |--------------------------------------------------------------------------
    |
    | Minimum quality score (0-1) to accept geocoding results.
    | Lower scores may indicate approximate or uncertain locations.
    |
    */
    'min_quality_score' => env('GEOCODING_MIN_QUALITY', 0.5),

    /*
    |--------------------------------------------------------------------------
    | Default Coordinates
    |--------------------------------------------------------------------------
    |
    | Default coordinates used when geocoding fails completely.
    | These represent Phnom Penh, Cambodia.
    |
    */
    'default_location' => [
        'latitude' => 11.5564,
        'longitude' => 104.9282,
        'use_on_failure' => env('GEOCODING_USE_DEFAULT_ON_FAILURE', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Retry Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for retrying failed geocoding attempts.
    |
    */
    'retry' => [
        'max_attempts' => 3,
        'delay' => 2, // seconds between retries
        'multiplier' => 2, // exponential backoff multiplier
    ],
];

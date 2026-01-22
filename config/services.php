<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    /*
    |--------------------------------------------------------------------------
    | OSRM Routing Service
    |--------------------------------------------------------------------------
    | Configuration for Open Source Routing Machine (OSRM)
    | Used for route optimization and distance calculations
    */

    'osrm' => [
        'url' => env('OSRM_URL', 'https://router.project-osrm.org'),
        'profile' => env('OSRM_PROFILE', 'driving'), // driving, walking, cycling
        'geometries' => 'geojson',
        'overview' => 'full',
        'steps' => true,
        'annotations' => true,
        'max_waypoints' => env('OSRM_MAX_WAYPOINTS', 25),
        'timeout' => env('OSRM_TIMEOUT', 10), // seconds
    ],

];

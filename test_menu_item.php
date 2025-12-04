<?php

use Illuminate\Support\Facades\Http;

$response = Http::acceptJson()->post('http://127.0.0.1:8000/api/menu-items', [
    'name' => 'Test Item',
    'slug' => 'test-item-' . time(),
    'price' => 10.00,
    'location_id' => 1,
    'is_active' => 1,
    // category_id is missing, which should be fine as it is nullable
]);

echo "Status: " . $response->status() . "\n";
echo "Body: " . $response->body() . "\n";

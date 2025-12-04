<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\MenuItemController;

// Simulate a request directly to the controller to bypass HTTP layer issues if any, 
// or just use internal request dispatching.
// Actually, let's just use the facade if the app is booted.

$request = Request::create('/api/menu-items', 'POST', [
    'name' => 'Test Item',
    'slug' => 'test-item-' . time(),
    'price' => 10.00,
    'location_id' => 1,
    'is_active' => 1,
    'category_id' => null
]);

// We need to resolve the controller and call the method.
// But validation happens in FormRequest.
// Let's try to manually validate using the FormRequest class.

$formRequest = new \App\Http\Requests\Api\MenuItem\StoreMenuItemRequest();

$validator = Illuminate\Support\Facades\Validator::make($request->all(), $formRequest->rules());

if ($validator->fails()) {
    echo "Validation Failed:\n";
    print_r($validator->errors()->toArray());
} else {
    echo "Validation Passed!\n";
}

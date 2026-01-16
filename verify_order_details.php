<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;
use App\Models\Location;
use App\Http\Controllers\Api\OrderController;
use Illuminate\Http\Request;

echo "--- Verifying Order Details View (Controller::show) ---\n";

// Get latest order
$order = Order::latest()->first();

if (!$order) {
    die("❌ No orders found.\n");
}

echo "Testing Show for Order ID: {$order->id}\n";

try {
    // Authenticate as a user (admin)
    $user = \App\Models\User::first();
    if ($user) {
        \Illuminate\Support\Facades\Auth::login($user);
    }

    $controller = app(OrderController::class);
    
    // Call show
    $resource = $controller->show($order);
    
    echo "✅ Controller::show() returned successfully.\n";
    
    // Check if relationships are loaded
    $relationships = ['items', 'invoice', 'customer', 'table'];
    foreach ($relationships as $rel) {
        if ($order->relationLoaded($rel)) {
            echo "✅ Relation '$rel' loaded.\n";
        } else {
             // Some might not be loaded if lazy loading happens inside Resource,
             // but Controller::show calls ->load() explicitly so they should be loaded on $order instance passed to Resource?
             // Actually params to Resource constructor.
             // Let's check the resource data if possible, or just the loaded relations on the original object
             // because show() does $order->load(...) which modifies the instance.
             echo "❓ Relation '$rel' not loaded on model instance (might be lazy loaded in resource). Loaded: " . ($order->relationLoaded($rel)?'Yes':'No') . "\n";
        }
    }
    
    // Convert to JSON to verify serialization works (no recursion or errors)
    $json = $resource->response()->content();
    
    if (json_validate($json)) {
        echo "✅ Resource serialized to valid JSON.\n";
    } else {
        echo "❌ JSON Serialization Failed!\n";
    }

} catch (\Exception $e) {
    echo "❌ Exception: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}

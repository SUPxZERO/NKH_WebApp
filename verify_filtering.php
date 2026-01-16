<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;
use App\Models\Location;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\OrderController;
use Illuminate\Support\Str;

// Setup Data
$location = Location::first();

// Create distinctive orders for filtering
$orderPending = Order::create([
    'location_id' => $location->id,
    'order_number' => 'FILTER-PEND-' . Str::random(5),
    'order_type' => 'delivery',
    'approval_status' => 'pending',
    'total_amount' => 10.00,
    'currency' => 'USD',
    'ordered_at' => now(),
]);
$orderPending->setStatus('pending');
$orderPending->save();

$orderCompleted = Order::create([
    'location_id' => $location->id,
    'order_number' => 'FILTER-COMP-' . Str::random(5),
    'order_type' => 'dine-in',
    'approval_status' => 'approved',
    'total_amount' => 20.00,
    'currency' => 'USD',
    'ordered_at' => now(),
]);
$orderCompleted->setStatus('completed');
$orderCompleted->save();

echo "Created Orders:\n";
echo "1. {$orderPending->order_number} (Status: pending, Type: delivery)\n";
echo "2. {$orderCompleted->order_number} (Status: completed, Type: dine-in)\n";

try {
    // Authenticate as a user (admin)
    $user = \App\Models\User::first();
    if (!$user) {
        die("❌ No users found in DB. Run seeders first.\n");
    }
    // Ensure user has employee record for controller logic if needed (controller checks Employee::where('user_id'...))
    // Actually store() checks employee, index() might just need auth? 
    // index() doesn't seem to check employee existence explicitly but let's be safe if it filters by location.
    
    \Illuminate\Support\Facades\Auth::login($user);

    $controller = app(OrderController::class);
    
    // TEST 1: Filter by Status 'pending'
    echo "\n--- TEST 1: Filter by Status 'pending' ---\n";
    $req1 = Request::create('/api/admin/orders', 'GET', ['status' => 'pending']);
    app()->instance('request', $req1);
    $res1 = $controller->index($req1);
    $data1 = $res1->resource->items(); // Paginator items
    
    $foundPending = false;
    $foundCompleted = false;
    foreach ($data1 as $o) {
        if ($o->id === $orderPending->id) $foundPending = true;
        if ($o->id === $orderCompleted->id) $foundCompleted = true;
    }
    
    if ($foundPending && !$foundCompleted) {
        echo "✅ Status Filter Verified!\n";
    } else {
        echo "❌ Status Filter Failed! (Pending: " . ($foundPending?'Yes':'No') . ", Completed: " . ($foundCompleted?'Yes':'No') . ")\n";
    }

    // TEST 2: Filter by Type 'dine-in'
    echo "\n--- TEST 2: Filter by Type 'dine-in' ---\n";
    $req2 = Request::create('/api/admin/orders', 'GET', ['type' => 'dine-in']);
    app()->instance('request', $req2);
    $res2 = $controller->index($req2);
    $data2 = $res2->resource->items();
    
    $foundPending2 = false;
    $foundCompleted2 = false;
    foreach ($data2 as $o) {
        if ($o->id === $orderPending->id) $foundPending2 = true;
        if ($o->id === $orderCompleted->id) $foundCompleted2 = true;
    }
    
    if (!$foundPending2 && $foundCompleted2) {
        echo "✅ Type Filter Verified!\n";
    } else {
         echo "❌ Type Filter Failed! (Pending: " . ($foundPending2?'Yes':'No') . ", Completed: " . ($foundCompleted2?'Yes':'No') . ")\n";
    }

    // TEST 3: Search by Order Number
    echo "\n--- TEST 3: Search by Order Number 'FILTER-PEND' ---\n";
    $req3 = Request::create('/api/admin/orders', 'GET', ['search' => 'FILTER-PEND']);
    app()->instance('request', $req3);
    $res3 = $controller->index($req3);
    $data3 = $res3->resource->items();
    
    $foundPending3 = false;
    $foundCompleted3 = false;
    foreach ($data3 as $o) {
        if ($o->id === $orderPending->id) $foundPending3 = true;
        if ($o->id === $orderCompleted->id) $foundCompleted3 = true;
    }
    
    if ($foundPending3 && !$foundCompleted3) {
        echo "✅ Search Verified!\n";
    } else {
         echo "❌ Search Failed! (Pending: " . ($foundPending3?'Yes':'No') . ", Completed: " . ($foundCompleted3?'Yes':'No') . ")\n";
    }

} catch (\Exception $e) {
    echo "❌ Exception: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}

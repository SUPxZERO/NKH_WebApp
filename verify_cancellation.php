<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;
use App\Models\Location;
use Illuminate\Support\Str;

// Setup Data
$location = Location::first();

// --- TEST 1: Reject Pending Order ---
echo "--- TEST 1: Rejecting Pending Order ---\n";
$order1 = Order::create([
    'location_id' => $location->id,
    'order_number' => 'TEST-REJECT-' . Str::random(5),
    'order_type' => 'delivery',
    'approval_status' => 'pending',
    'payment_status' => 'unpaid',
    'total_amount' => 20.00,
    'currency' => 'USD',
    'ordered_at' => now(),
]);
$order1->setStatus('pending');
$order1->save();

echo "Created Pending Order: {$order1->order_number} (ID: {$order1->id})\n";

try {
    $reason = "Out of delivery range";
    $success = $order1->reject($reason);
    
    $order1->refresh();
    
    echo "Rejection Status: " . ($success ? "TRUE" : "FALSE") . "\n";
    echo "New Approval Status: {$order1->approval_status}\n";
    echo "Order Status Code: " . ($order1->orderStatus->code ?? 'NULL') . "\n";
    echo "Rejection Reason: {$order1->rejection_reason}\n";
    
    if ($order1->approval_status === 'rejected' && $order1->orderStatus->code === 'cancelled' && $order1->rejection_reason === $reason) {
        echo "✅ Rejection Verified!\n";
    } else {
        echo "❌ Rejection Failed!\n";
    }
} catch (\Exception $e) {
    echo "❌ Rejection Exception: " . $e->getMessage() . "\n";
}

// --- TEST 2: Cancel Active Order ---
echo "\n--- TEST 2: Cancelling Active Order ---\n";
$order2 = Order::create([
    'location_id' => $location->id,
    'order_number' => 'TEST-CANCEL-' . Str::random(5),
    'order_type' => 'dine-in',
    'approval_status' => 'approved',
    'payment_status' => 'unpaid',
    'total_amount' => 30.00,
    'currency' => 'USD',
    'ordered_at' => now(),
]);
$order2->setStatus('preparing');
$order2->save();

echo "Created Active Order: {$order2->order_number} (ID: {$order2->id}) Status: preparing\n";

try {
    // Testing updateStatus to 'cancelled' (Manual cancellation by admin)
    // We mimic Controller logic which calls setStatus
    $order2->setStatus('cancelled');
    $order2->save();
    
    $order2->refresh();
    
    echo "New Order Status Code: " . ($order2->orderStatus->code ?? 'NULL') . "\n";
    
    if ($order2->orderStatus->code === 'cancelled') {
        echo "✅ Cancellation Verified!\n";
    } else {
        echo "❌ Cancellation Failed!\n";
    }
} catch (\Exception $e) {
    echo "❌ Cancellation Exception: " . $e->getMessage() . "\n";
}

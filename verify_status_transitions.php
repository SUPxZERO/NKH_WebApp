<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;
use App\Models\OrderStatus;

// Create a new order for testing transitions
$order = Order::create([
    'location_id' => 1,
    'order_number' => 'TEST-TRANSITION-' . time(),
    'order_type' => 'delivery',
    'approval_status' => 'pending',
    'payment_status' => 'unpaid',
    'total_amount' => 10.00,
    'currency' => 'USD',
    'ordered_at' => now(),
]);

echo "Created Order ID: {$order->id}\n";

$statusesToTest = ['preparing', 'ready', 'completed', 'cancelled', 'received'];

foreach ($statusesToTest as $code) {
    echo "Testing transition to '{$code}'... ";
    
    try {
        $order->setStatus($code);
        $order->save();
        $order->refresh();
        
        $statusModel = OrderStatus::where('code', $code)->first();
        
        if ($order->order_status_id === $statusModel->id) {
            echo "✅ Success (ID: {$order->order_status_id})\n";
        } else {
            echo "❌ Failed! Expected ID {$statusModel->id}, got {$order->order_status_id}\n";
        }
        
    } catch (\Exception $e) {
        echo "❌ Exception: " . $e->getMessage() . "\n";
    }
}

// Cleanup
//$order->delete();

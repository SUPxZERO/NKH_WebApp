<?php

use App\Models\Order;
use Carbon\Carbon;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Create orders for this week with varying amounts
$startOfWeek = Carbon::now()->startOfWeek();
$ordersCreated = 0;

echo "Creating test orders for revenue charts...\n";

for ($i = 0; $i < 7; $i++) {
    $date = $startOfWeek->copy()->addDays($i);
    // Create 2-3 orders per day
    $numOrders = rand(2, 3);
    for ($j = 0; $j < $numOrders; $j++) {
        $hour = rand(8, 20);
        $orderDate = $date->copy()->setHour($hour)->setMinute(rand(0, 59));
        
        $order = new Order();
        $order->location_id = 1;
        $order->order_number = 'TEST-' . time() . '-' . $ordersCreated;
        $order->total_amount = rand(50, 300);
        $order->subtotal = rand(40, 250);
        $order->tax_amount = rand(5, 30);
        $order->discount_amount = 0;
        $order->ordered_at = $orderDate;
        $order->completed_at = $orderDate->copy()->addMinutes(rand(15, 45));
        $order->payment_status = 'paid';
        $order->payment_mode = 'pay_now';
        $order->currency = 'USD';
        $order->save();
        
        $ordersCreated++;
        echo "Created order: {$order->order_number} on {$orderDate->format('Y-m-d H:i')}\n";
    }
}

echo "\nTotal: Created $ordersCreated test orders for the current week.\n";

<?php
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;
use App\Models\OrderStatus;
use Carbon\Carbon;

$today = Carbon::today();
echo "Checking orders for today: " . $today->toDateString() . PHP_EOL;

$orders = Order::whereDate('created_at', $today)->get();
echo "Total Orders Today: " . $orders->count() . PHP_EOL;

if ($orders->count() > 0) {
    echo "\nSample Orders:\n";
    foreach($orders->take(5) as $order) {
        $status = $order->orderStatus;
        echo "ID: {$order->id} | Status: " . ($status ? $status->code : 'NULL') . 
             " | Total Amount: {$order->total_amount} | Created: {$order->created_at}" . PHP_EOL;
    }
    
    echo "\nCalculating Revenue (excluding cancelled/rejected):\n";
    $revenue = Order::whereDate('created_at', $today)
        ->whereHas('orderStatus', fn($q) => $q->whereNotIn('code', ['cancelled', 'rejected']))
        ->sum('total_amount');
    
    echo "Calculated Revenue: " . $revenue . PHP_EOL;
} else {
    echo "No orders found for today.\n";
}

echo "\nChecking Order Statuses:\n";
$statuses = OrderStatus::all();
foreach($statuses as $s) {
    echo "ID: {$s->id} | Code: {$s->code} | Name: {$s->name}\n";
}

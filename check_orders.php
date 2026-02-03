<?php

use App\Models\Order;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Server Time: " . now() . "\n";
echo "Server Timezone: " . config('app.timezone') . "\n";

try {
    $dbTz = DB::select('SELECT @@global.time_zone as global_tz, @@session.time_zone as session_tz');
    echo "DB Timezone: Global=" . $dbTz[0]->global_tz . ", Session=" . $dbTz[0]->session_tz . "\n";
} catch (\Exception $e) {
    echo "Could not fetch DB timezone: " . $e->getMessage() . "\n";
}

echo "\n--- Last 10 Orders ---\n";
try {
    $orders = Order::orderBy('created_at', 'desc')->take(10)->get();

    foreach ($orders as $order) {
        echo "ID: {$order->id} | Created: {$order->created_at} | Status: {$order->status} | Total: {$order->total_amount}\n";
    }
} catch (\Exception $e) {
    echo "Error fetching orders: " . $e->getMessage() . "\n";
}

echo "\n--- Count for Today (2026-01-28) ---\n";
$today = Carbon::parse('2026-01-28');
$count = Order::whereDate('created_at', $today)->count();
echo "Orders created on 2026-01-28: $count\n";

echo "\n--- Active Orders ---\n";
$active = Order::whereHas('orderStatus', function ($q) {
    $q->whereIn('code', ['pending', 'received', 'preparing', 'ready']);
})->count();
echo "Active orders count: $active\n";

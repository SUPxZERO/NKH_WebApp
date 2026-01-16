<?php
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;
use Carbon\Carbon;

$today = Carbon::today();
$orders = Order::whereDate('created_at', $today)->with('orderStatus')->get();

echo "Count: " . $orders->count() . "\n";
foreach($orders as $o) {
    echo "ID:{$o->id} Status:{$o->orderStatus->code} Total:{$o->total_amount}\n";
}

<?php
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;
use Carbon\Carbon;

$today = Carbon::today();
$orders = Order::whereDate('created_at', $today)->get();

echo "Count: " . $orders->count() . "\n";
foreach($orders as $o) {
    $statusId = $o->order_status_id;
    $total = $o->total_amount;
    echo "ID:{$o->id} StatusID:{$statusId} Total:{$total}\n";
}

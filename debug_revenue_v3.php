<?php
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;
use Carbon\Carbon;

$today = Carbon::today();
echo "Checking Revenue Logic for Today: " . $today->toDateString() . "\n";

$revenue = Order::whereDate('created_at', $today)
    ->where(function($q) {
        $q->doesntHave('orderStatus')
          ->orWhereHas('orderStatus', fn($sq) => $sq->whereNotIn('code', ['cancelled', 'rejected']));
    })
    ->sum('total_amount');

echo "Calculated Revenue: $" . number_format($revenue, 2) . "\n";

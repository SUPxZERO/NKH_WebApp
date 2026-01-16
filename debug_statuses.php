<?php
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$statuses = DB::table('order_statuses')->get();
echo "Order Statuses:\n";
foreach ($statuses as $s) {
    echo "ID: {$s->id} | Name: {$s->name} | Code: " . ($s->code ?? 'N/A') . "\n";
}

<?php
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\OrderStatus;

// 1. Rename Confirmed -> Received
$confirmed = OrderStatus::where('code', 'confirmed')->first();
$received = OrderStatus::where('code', 'received')->first();

if ($confirmed && !$received) {
    echo "Renaming confirmed -> received\n";
    $confirmed->update(['code' => 'received', 'name' => 'Received']);
} elseif (!$received) {
    echo "Creating received status\n";
    OrderStatus::create([
        'code' => 'received', 
        'name' => 'Received', 
        'color' => '#4CAF50', 
        'display_order' => 2,
        'workflow_position' => 2
    ]);
} else {
    echo "Status 'received' exists.\n";
}

// 2. Ensure Preparing exists
$preparing = OrderStatus::where('code', 'preparing')->first();
if (!$preparing) {
    echo "Creating preparing status\n";
    OrderStatus::create([
        'code' => 'preparing', 
        'name' => 'Preparing', 
        'color' => '#2196F3', 
        'display_order' => 3, 
        'workflow_position' => 3
    ]);
} else {
    echo "Status 'preparing' exists.\n";
}

// 3. Ensure Ready exists
$ready = OrderStatus::where('code', 'ready')->first();
if (!$ready) {
    echo "Creating ready status\n";
    OrderStatus::create([
        'code' => 'ready', 
        'name' => 'Ready', 
        'color' => '#9C27B0', 
        'display_order' => 4, 
        'workflow_position' => 4
    ]);
} else {
    echo "Status 'ready' exists.\n";
}

echo "Simple fix done.\n";

<?php
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\OrderStatus;

$requiredStatuses = [
    'pending' => ['name' => 'Pending', 'color' => '#FFA500', 'display_order' => 1],
    'received' => ['name' => 'Received', 'color' => '#4CAF50', 'display_order' => 2],
    'preparing' => ['name' => 'Preparing', 'color' => '#2196F3', 'display_order' => 3],
    'ready' => ['name' => 'Ready', 'color' => '#9C27B0', 'display_order' => 4],
    'served' => ['name' => 'Served', 'color' => '#4CAF50', 'display_order' => 5],
    'completed' => ['name' => 'Completed', 'color' => '#4CAF50', 'display_order' => 6],
    'cancelled' => ['name' => 'Cancelled', 'color' => '#F44336', 'display_order' => 7],
];

// Check for 'confirmed' and rename to 'received' if 'received' is missing
$confirmed = OrderStatus::where('code', 'confirmed')->first();
$received = OrderStatus::where('code', 'received')->first();

if ($confirmed && !$received) {
    echo "Renaming 'confirmed' to 'received'...\n";
    $confirmed->update([
        'code' => 'received',
        'name' => 'Received', // Optional: keep 'Confirmed' name but change code? Controller expects code 'received'.
    ]);
}

foreach ($requiredStatuses as $code => $data) {
    $status = OrderStatus::where('code', $code)->first();
    if (!$status) {
        echo "Creating missing status: {$code}\n";
        OrderStatus::create([
            'code' => $code,
            'name' => $data['name'],
            'description' => "Auto-generated status for {$code}",
            'color' => $data['color'],
            'display_order' => $data['display_order'],
            'workflow_position' => $data['display_order'],
            'is_terminal' => in_array($code, ['completed', 'cancelled', 'served']),
        ]);
    } else {
        echo "Status exists: {$code} (ID: {$status->id})\n";
    }
}

echo "Status fix complete.\n";

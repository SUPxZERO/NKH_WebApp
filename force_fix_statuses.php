<?php
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\OrderStatus;

$requiredStatuses = [
    'pending' => ['name' => 'Pending', 'color' => '#FFA500', 'display_order' => 1, 'id' => 1],
    'received' => ['name' => 'Received', 'color' => '#4CAF50', 'display_order' => 2, 'id' => 2],
    'preparing' => ['name' => 'Preparing', 'color' => '#2196F3', 'display_order' => 3, 'id' => 3],
    'ready' => ['name' => 'Ready', 'color' => '#9C27B0', 'display_order' => 4, 'id' => 4],
    'served' => ['name' => 'Served', 'color' => '#4CAF50', 'display_order' => 5, 'id' => 5],
    'completed' => ['name' => 'Completed', 'color' => '#4CAF50', 'display_order' => 6, 'id' => 6],
    'cancelled' => ['name' => 'Cancelled', 'color' => '#F44336', 'display_order' => 7, 'id' => 7],
];

// Handle 'confirmed' -> 'received' migration
$confirmed = OrderStatus::where('code', 'confirmed')->first();
$received = OrderStatus::where('code', 'received')->first();

if ($confirmed) {
    echo "Found status 'confirmed'.\n";
    if ($received) {
        // Both exist. Delete 'confirmed' to avoid confusion, or keep it if order use it?
        // Ideally migrate orders, but for now just rename confirmed if we can safely delete the old one?
        // Actually, if we have duplicate, we should probably merge.
        // Let's just delete 'confirmed' if it has no orders?
        echo "'received' also exists. Deleting 'confirmed' to resolve conflict...\n";
        $confirmed->delete(); 
    } else {
        echo "Renaming 'confirmed' to 'received'...\n";
        $confirmed->code = 'received';
        $confirmed->name = 'Received';
        $confirmed->save();
    }
}

foreach ($requiredStatuses as $code => $data) {
    $existing = OrderStatus::where('code', $code)->first();
    
    if ($existing) {
        echo "Updating existing status: {$code}\n";
        $existing->update([
            'name' => $data['name'],
            'color' => $data['color'],
            'display_order' => $data['display_order'],
            'workflow_position' => $data['display_order'],
            'is_terminal' => in_array($code, ['completed', 'cancelled', 'served']),
        ]);
    } else {
        echo "Creating new status: {$code}\n";
        // Force ID if possible, but might conflict. Better to let DB handle ID if not strictly required to be static.
        // But seeders use ID 1..7 usually.
        OrderStatus::create([
            'code' => $code,
            'name' => $data['name'],
            'description' => "Auto-generated status for {$code}",
            'color' => $data['color'],
            'display_order' => $data['display_order'],
            'workflow_position' => $data['display_order'],
            'is_terminal' => in_array($code, ['completed', 'cancelled', 'served']),
        ]);
    }
}

echo "Force status fix complete.\n";

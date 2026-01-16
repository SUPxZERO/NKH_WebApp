<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;
use Illuminate\Http\Request;

echo "--- Reproducing Filtering Bug ---\n";

try {
    // Logic from OrderController::index
    $query = Order::query();
    
    // Mimic request status='pending'
    $status = 'pending';
    
    echo "Applying filter: where('status', '$status')\n";
    
    // This should fail if 'status' column is gone
    $query->where('status', $status);
    
    $results = $query->get();
    
    echo "✅ Query Successful (Unexpected!)\n";
    
} catch (\Illuminate\Database\QueryException $e) {
    echo "✅ CONFIRMED BUG: Query failed as expected.\n";
    echo "Error: " . $e->getMessage() . "\n";
} catch (\Exception $e) {
    echo "❌ Unexpected Exception: " . $e->getMessage() . "\n";
}

<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;

echo "--- Verifying Filtering SQL Generation ---\n";

// Mimic the Controller Logic
$status = 'pending';
$query = Order::query();

echo "Applying logic: whereHas('orderStatus', ...)\n";

// The LOGIC from the Controller
$query->whereHas('orderStatus', function ($q) use ($status) {
    $q->where('code', $status);
});

$sql = $query->toSql();
echo "Generated SQL: " . $sql . "\n";

if (str_contains($sql, 'order_statuses') && str_contains($sql, 'exists')) {
    echo "✅ SQL Verification Passed: Query uses 'exists' subquery on 'order_statuses'.\n";
} else {
    echo "❌ SQL Verification Failed: SQL does not look right.\n";
}

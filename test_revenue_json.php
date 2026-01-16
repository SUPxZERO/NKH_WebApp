<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

use App\Services\Dashboard\DashboardDataService;

try {
    $dashboard = new DashboardDataService();
    
    echo "=== Testing Revenue API Output (JSON format) ===\n\n";
    
    // Daily - should have 7 data points
    $daily = $dashboard->getRevenueByRange('daily');
    echo "DAILY:\n";
    echo json_encode($daily, JSON_PRETTY_PRINT) . "\n\n";
    
    // Weekly - should have 4 data points
    $weekly = $dashboard->getRevenueByRange('weekly');
    echo "WEEKLY:\n";
    echo json_encode($weekly, JSON_PRETTY_PRINT) . "\n\n";
    
    // Monthly - should have 6 data points
    $monthly = $dashboard->getRevenueByRange('monthly');
    echo "MONTHLY:\n";
    echo json_encode($monthly, JSON_PRETTY_PRINT) . "\n\n";
    
} catch (\Exception $e) {
    echo "\n\n=== ERROR ===\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
}

<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

use App\Services\Dashboard\DashboardDataService;

try {
    $dashboard = new DashboardDataService();
    
    echo "=== Testing Revenue by Range ===\n\n";
    
    echo "1. Daily revenue:\n";
    $daily = $dashboard->getRevenueByRange('daily');
    echo "   Range: {$daily['range']}\n";
    echo "   Count: {$daily['count']}\n";
    echo "   Total: {$daily['total']}\n";
    echo "   Data: " . json_encode($daily['data']) . "\n\n";
    
    echo "2. Weekly revenue:\n";
    $weekly = $dashboard->getRevenueByRange('weekly');
    echo "   Range: {$weekly['range']}\n";
    echo "   Count: {$weekly['count']}\n";
    echo "   Total: {$weekly['total']}\n";
    echo "   Data: " . json_encode($weekly['data']) . "\n\n";
    
    echo "3. Monthly revenue:\n";
    $monthly = $dashboard->getRevenueByRange('monthly');
    echo "   Range: {$monthly['range']}\n";
    echo "   Count: {$monthly['count']}\n";
    echo "   Total: {$monthly['total']}\n";
    echo "   Data: " . json_encode($monthly['data']) . "\n\n";
    
    echo "=== All tests passed! ===\n";
    
} catch (\Exception $e) {
    echo "\n\n=== ERROR ===\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "\nStack trace:\n" . $e->getTraceAsString() . "\n";
}

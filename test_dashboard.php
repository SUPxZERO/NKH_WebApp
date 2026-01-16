<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

use App\Services\Dashboard\DashboardDataService;
use App\Services\Analytics\AnalyticsService;
use App\Models\User;
use Carbon\Carbon;

try {
    $user = User::first();
    if (!$user) {
        echo "No user found!\n";
        exit(1);
    }
    
    echo "User: " . $user->name . "\n";
    echo "Roles: " . json_encode($user->roles->pluck('slug')) . "\n\n";
    
    $dashboard = new DashboardDataService();
    $analytics = app(AnalyticsService::class);
    
    echo "=== Testing DashboardDataService ===\n\n";
    
    echo "1. getSummary...\n";
    $summary = $dashboard->getSummary($user);
    echo "   OK: " . json_encode(array_keys($summary)) . "\n\n";
    
    echo "2. getAlerts...\n";
    $alerts = $dashboard->getAlerts($user);
    echo "   OK: " . count($alerts) . " alerts\n\n";
    
    echo "3. getQuickStats...\n";
    $quickStats = $dashboard->getQuickStats();
    echo "   OK: " . json_encode($quickStats) . "\n\n";
    
    echo "4. getActivityFeed...\n";
    $activityFeed = $dashboard->getActivityFeed(8);
    echo "   OK: " . count($activityFeed) . " activities\n\n";
    
    echo "5. getRevenueByRange (daily)...\n";
    $revenue = $dashboard->getRevenueByRange('daily');
    echo "   OK: " . json_encode($revenue) . "\n\n";
    
    echo "=== Testing AnalyticsService ===\n\n";
    
    $defaultDays = 7;
    
    echo "6. getKPIs...\n";
    $kpis = $analytics->getKPIs(Carbon::now()->subDays($defaultDays), Carbon::now());
    echo "   OK: " . json_encode($kpis) . "\n\n";
    
    echo "7. getOrderStatusCounts...\n";
    $orderStatus = $analytics->getOrderStatusCounts(Carbon::now()->subDays($defaultDays), Carbon::now());
    echo "   OK: " . json_encode($orderStatus) . "\n\n";
    
    echo "8. getTopSellingItems...\n";
    $topItems = $analytics->getTopSellingItems(Carbon::now()->subDays($defaultDays), Carbon::now());
    echo "   OK: " . count($topItems) . " items\n\n";
    
    echo "=== All tests passed! ===\n";
    
} catch (\Exception $e) {
    echo "\n\n=== ERROR ===\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "\nStack trace:\n" . $e->getTraceAsString() . "\n";
}

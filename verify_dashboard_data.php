<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;
use App\Models\Payment;
use App\Models\OrderItem;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

// Simulate the date range used in the controller (Last 7 days to Now)
$startDate = Carbon::now()->subDays(7);
$endDate = Carbon::now();

echo "Debug Info:\n";
echo "Start Date: " . $startDate->toDateTimeString() . "\n";
echo "End Date:   " . $endDate->toDateTimeString() . "\n";
echo "Current Time: " . Carbon::now()->toDateTimeString() . "\n\n";

// 1. Check Orders
$totalOrders = Order::whereBetween('created_at', [$startDate, $endDate])->count();
echo "Total Orders (Last 7 Days): $totalOrders\n";

$allOrders = Order::count();
echo "Total Orders (All Time): $allOrders\n";
if ($allOrders > 0 && $totalOrders == 0) {
    echo "WARNING: Orders exist but not in range. Sample Order Created At: " . Order::first()->created_at . "\n";
}

// 2. Check Payments (Revenue)
$totalPaymentCount = Payment::whereBetween('created_at', [$startDate, $endDate])->count();
echo "Total Payments (Last 7 Days): $totalPaymentCount\n";

$successfulPayments = Payment::whereBetween('created_at', [$startDate, $endDate])
    ->whereHas('paymentStatus', function($q) {
        $q->where('is_successful', true); // Check if this column exists or we need to use 'code'
    })->count();
echo "Successful Payments: $successfulPayments\n";

// 3. Check Order Statuses
$statusCounts = Order::whereBetween('created_at', [$startDate, $endDate])
    ->select('order_status_id', DB::raw('count(*) as count'))
    ->groupBy('order_status_id')
    ->get();

echo "Order Status Counts:\n";
foreach ($statusCounts as $sc) {
    echo "  Status ID {$sc->order_status_id}: {$sc->count}\n";
}

// 4. Try to make the exact call the controller makes
try {
    $analytics = new \App\Services\Analytics\AnalyticsService();
    $kpis = $analytics->getKPIs($startDate, $endDate);
    echo "\nAnalyticsService::getKPIs output:\n";
    print_r($kpis);

    echo "\nAnalyticsService::getDailyRevenue output (JSON):\n";
    echo json_encode($analytics->getDailyRevenue($startDate, $endDate), JSON_PRETTY_PRINT) . "\n";

    echo "\nAnalyticsService::getOrderStatusCounts output (JSON):\n";
    echo json_encode($analytics->getOrderStatusCounts($startDate, $endDate), JSON_PRETTY_PRINT) . "\n";
} catch (\Exception $e) {
    echo "\nERROR calling AnalyticsService: " . $e->getMessage() . "\n";
}

// 5. Deep Dive on Invoices
echo "\n--- Deep Dive ---\n";
$paidInvoices = \App\Models\Invoice::where('status', 'paid')->count();
$allInvoices = \App\Models\Invoice::count();
$paymentMethods = \App\Models\PaymentMethod::count();

echo "Total Invoices: $allInvoices\n";
echo "Paid Invoices: $paidInvoices\n";
echo "Payment Methods: $paymentMethods\n";

if ($paidInvoices > 0 && $totalPaymentCount == 0) {
    echo "CRITICAL: Paid invoices exist but NO payments were created!\n";
    // Check if PaymentSeeder actually ran? It did in the logs.
    // Check why it skipped them. Logic: Invoice::whereIn('status', ['paid', 'partial'])
}

<?php

/**
 * ADMIN ORDERS FIX - QUICK DIAGNOSTIC SCRIPT
 * 
 * Run this in tinker to verify the fix:
 * php artisan tinker
 * include 'ADMIN_ORDERS_TEST.php';
 */

use App\Models\Order;
use Illuminate\Support\Facades\DB;

echo "\n";
echo "═══════════════════════════════════════════════════════\n";
echo "  ADMIN ORDERS DIAGNOSTIC TEST\n";
echo "═══════════════════════════════════════════════════════\n\n";

// Test 1: Total Orders
echo "TEST 1: Total Orders in Database\n";
echo "─────────────────────────────────────────────────────────\n";
$totalOrders = Order::count();
echo "✅ Total orders: {$totalOrders}\n\n";

if ($totalOrders === 0) {
    echo "❌ WARNING: No orders found in database!\n";
    echo "   Place a test order first.\n\n";
    return;
}

// Test 2: Orders by Approval Status
echo "TEST 2: Orders by Approval Status\n";
echo "─────────────────────────────────────────────────────────\n";
$byApproval = Order::select('approval_status', DB::raw('count(*) as count'))
    ->groupBy('approval_status')
    ->get();

foreach ($byApproval as $row) {
    echo "  {$row->approval_status}: {$row->count}\n";
}
echo "\n";

// Test 3: Orders by Status
echo "TEST 3: Orders by Order Status\n";
echo "─────────────────────────────────────────────────────────\n";
$byStatus = Order::select('status', DB::raw('count(*) as count'))
    ->groupBy('status')
    ->get();

foreach ($byStatus as $row) {
    echo "  {$row->status}: {$row->count}\n";
}
echo "\n";

// Test 4: OLD Query (What was returned before fix)
echo "TEST 4: OLD Query Results (excluding pending approval)\n";
echo "─────────────────────────────────────────────────────────\n";
$oldCount = Order::where('approval_status', '!=', 'pending')->count();
echo "  Old query returned: {$oldCount} orders\n";
echo "  ❌ This is WHY admin saw 0 orders!\n\n";

// Test 5: NEW Query (What is returned after fix)
echo "TEST 5: NEW Query Results (showing all)\n";
echo "─────────────────────────────────────────────────────────\n";
$newCount = Order::count();
echo "  New query returns: {$newCount} orders\n";
echo "  ✅ Admin should now see {$newCount} orders!\n\n";

// Test 6: Sample Orders
echo "TEST 6: Sample Recent Orders\n";
echo "─────────────────────────────────────────────────────────\n";
$recent = Order::orderBy('created_at', 'desc')
    ->limit(5)
    ->get(['id', 'order_number', 'status', 'approval_status', 'order_type', 'total_amount', 'created_at']);

foreach ($recent as $order) {
    echo sprintf(
        "  #%s | %s | Status: %s | Approval: %s | $%.2f | %s\n",
        $order->order_number,
        ucfirst($order->order_type),
        $order->status,
        $order->approval_status,
        $order->total_amount,
        $order->created_at->format('M d, H:i')
    );
}
echo "\n";

// Test 7: API Query Simulation
echo "TEST 7: Simulate Admin Orders API Call\n";
echo "─────────────────────────────────────────────────────────\n";
$apiQuery = Order::with(['items.menuItem', 'table', 'customer.user', 'employee.user', 'timeSlot', 'location'])
    ->orderBy('ordered_at', 'desc')
    ->paginate(15);

echo "  Total: {$apiQuery->total()}\n";
echo "  Current Page: {$apiQuery->currentPage()}\n";
echo "  Per Page: {$apiQuery->perPage()}\n";
echo "  Showing: {$apiQuery->count()}\n";
echo "  Last Page: {$apiQuery->lastPage()}\n\n";

// Test 8: Filter by Approval Status (pending)
echo "TEST 8: Filter by Approval Status = 'pending'\n";
echo "─────────────────────────────────────────────────────────\n";
$pendingApproval = Order::where('approval_status', 'pending')
    ->count();
echo "  Pending approval orders: {$pendingApproval}\n";
echo "  These should show in admin when 'Needs Approval' filter is on\n\n";

// Test 9: Check for Missing Relations
echo "TEST 9: Check for Missing Customer Relations\n";
echo "─────────────────────────────────────────────────────────\n";
$withoutCustomer = Order::whereNull('customer_id')->count();
echo "  Orders without customer_id: {$withoutCustomer}\n";
if ($withoutCustomer > 0) {
    echo "  ⚠️  WARNING: Some orders have no customer!\n";
}
echo "\n";

// Summary
echo "═══════════════════════════════════════════════════════\n";
echo "  SUMMARY\n";
echo "═══════════════════════════════════════════════════════\n";
echo "  ✅ Database has {$totalOrders} total orders\n";
echo "  ❌ OLD query would show: {$oldCount} orders\n";
echo "  ✅ NEW query will show: {$newCount} orders\n";
echo "  📊 Difference: " . ($newCount - $oldCount) . " orders were HIDDEN!\n";
echo "\n";
echo "  EXPECTED RESULT in Admin Panel:\n";
echo "  - Total Orders: {$totalOrders}\n";
echo "  - Needs Approval: {$pendingApproval}\n";
echo "\n";
echo "  Next Steps:\n";
echo "  1. Refresh admin/orders page in browser\n";
echo "  2. Check browser console for debug logs\n";
echo "  3. Check Laravel logs: tail -f storage/logs/laravel.log\n";
echo "  4. Verify orders appear in the table\n";
echo "═══════════════════════════════════════════════════════\n\n";

// Additional Debug Info
echo "DEBUG INFO for Laravel Logs:\n";
echo "─────────────────────────────────────────────────────────\n";
echo "  Look for these log entries:\n";
echo "  - '📊 Admin Orders Query' with SQL and bindings\n";
echo "  - '✅ Admin Orders Result' with count\n";
echo "\n";
echo "  If you don't see orders, check:\n";
echo "  1. Routes are cached: php artisan route:clear\n";
echo "  2. Config is cached: php artisan config:clear\n";
echo "  3. Frontend is compiled: npm run dev is running\n";
echo "  4. Browser cache: Hard refresh (Ctrl+Shift+R)\n";
echo "═══════════════════════════════════════════════════════\n\n";

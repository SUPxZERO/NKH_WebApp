<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Middleware\EnsureCustomerAccess;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Routes are organized by section:
| 1. Public Routes
| 2. Customer Web Routes
| 3. Employee Web Routes
| 4. Admin Web Routes
| 5. Customer API Routes (session-based)
| 6. User API Routes (shared)
| 7. Employee API Routes (session-based)
| 8. Profile Routes
| 9. Auth Routes
|
*/

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

Route::get('/', [App\Http\Controllers\HomeController::class, 'index'])->name('home');

// Legal pages
Route::get('/terms', fn() => Inertia::render('Legal/Terms'))->name('legal.terms');
Route::get('/privacy', fn() => Inertia::render('Legal/Privacy'))->name('legal.privacy');

// DEVELOPMENT ONLY: Test payment page access
if (config('app.env') !== 'production') {
    Route::get('/test-payment', function () {
        $orderId = request('order_id', 199);
        $order = App\Models\Order::with(['items.menuItem', 'customer', 'table'])->findOrFail($orderId);

        return Inertia::render('Customer/Payment', [
            'order' => $order,
            'paymentMethods' => App\Models\PaymentMethod::where('is_active', true)->get(),
        ]);
    })->name('test.payment');
}

// QR Table Scan Landing Page (Sprint P17 - QR Table Ordering)
// Accessible without authentication - handles session creation via API
Route::get('/t/{token}', fn(string $token) => Inertia::render('Customer/TableScan', [
    'token' => $token,
]))->name('table.scan');

// ============================================================================
// CUSTOMER WEB ROUTES
// ============================================================================

// ALL customer routes are protected by EnsureCustomerAccess (Auth OR Telegram Guest)
Route::middleware([EnsureCustomerAccess::class])->group(function () {
    Route::get('/menu', fn() => Inertia::render('Customer/Menu'))->name('customer.menu');
    Route::get('/cart', fn() => Inertia::render('Customer/Cart'))->name('customer.cart');
    Route::get('/dashboard', fn() => Inertia::render('Customer/Dashboard'))->name('customer.dashboard');
    Route::get('/checkout', fn() => Inertia::render('Customer/Checkout'))->name('customer.checkout');
    Route::get('/payment', fn() => Inertia::render('Customer/Payment'))->name('customer.payment');
    Route::get('/reservation', fn() => redirect()->route('customer.reservations'))->name('customer.reservation');
    Route::get('/restaurant', fn() => Inertia::render('Customer/RestaurantDashboard'))->name('customer.restaurant');
    Route::get('/orders/{order}', fn() => Inertia::render('Customer/OrderDetail'))->name('customer.order.detail');
    Route::get('/track/{orderId}', fn() => Inertia::render('Customer/OrderTracking'))->name('customer.order.track');
});


// Temporary Fix Route
Route::middleware(['auth'])->get('/fix-my-profile', function () {
    $user = auth()->user();
    if (!$user->customer) {
        \App\Models\Customer::create([
            'user_id' => $user->id,
            'customer_code' => 'CUST-' . strtoupper(\Illuminate\Support\Str::random(8)),
            'loyalty_points' => 0,
            'points_balance' => 0,
            'total_spent' => 0,
        ]);

        // Ensure role is attached
        $role = \App\Models\Role::where('slug', 'customer')->first();
        if ($role && !$user->hasRole('customer')) {
            $user->roles()->attach($role);
        }

        return 'Fixed! Customer profile created. <a href="/customer/dashboard">Go to Dashboard</a>';
    }
    return 'Your profile is already fine. <a href="/customer/dashboard">Go to Dashboard</a>';
});

// Customer prefixed routes
Route::prefix('customer')->middleware([EnsureCustomerAccess::class])->group(function () {
    Route::get('/profile', fn() => Inertia::render('Customer/Profile'))->name('customer.profile');
    Route::get('/orders', fn() => Inertia::render('Customer/Orders'))->name('customer.orders');
    Route::get('/orders/{orderId}', fn($orderId) => Inertia::render('Customer/OrderDetails', ['orderId' => $orderId]))->name('customer.orders.show');
    Route::get('/loyalty', fn() => Inertia::render('Customer/Loyalty'))->name('customer.loyalty');
    Route::get('/reservations', fn() => Inertia::render('Customer/Reservations'))->name('customer.reservations');
    Route::get('/notifications', fn() => Inertia::render('Customer/Notifications'))->name('customer.notifications');
    Route::get('/feedback', fn() => Inertia::render('Customer/Feedback'))->name('customer.feedback');
    Route::get('/settings', fn() => Inertia::render('Customer/Settings'))->name('customer.settings');
    Route::get('/help', fn() => Inertia::render('Customer/HelpSupport'))->name('customer.help');

    // High, End Table Ordering Routes (Sprint P17)
    Route::prefix('table')->group(function () {
        Route::get('/menu', fn() => Inertia::render('Customer/Table/Menu'))->name('customer.table.menu');
        Route::get('/cart', fn() => Inertia::render('Customer/Table/Cart'))->name('customer.table.cart');
        Route::get('/success', fn() => Inertia::render('Customer/Table/OrderSuccess'))->name('customer.table.success');
        Route::get('/orders', fn() => Inertia::render('Customer/Table/Orders'))->name('customer.table.orders'); // Placeholder if needed
    });
});

// =========================================================================== =
// EMPLOYEE WEB ROUTES
// ============================================================================

Route::prefix('employee')->middleware('auth', 'role:employee,admin,manager,waiter,chef,cashier,driver,super-admin')->group(function () {
    // Dashboard
    Route::get('dashboard', fn() => Inertia::render('Employee/Dashboard'))->name('employee.dashboard');

    // Core Operations
    Route::get('pos', fn() => Inertia::render('Employee/POS'))->name('employee.pos');
    Route::get('kitchen', fn() => Inertia::render('Employee/KitchenDisplay'))->name('employee.kitchen');
    Route::get('delivery-orders', fn() => Inertia::render('Employee/DeliveryOrders'))->name('employee.delivery-orders');
    Route::get('cash-payments', fn() => Inertia::render('Employee/CashPayments'))->name('employee.cash-payments');

    // Schedule & Time
    Route::get('schedule', fn() => Inertia::render('Employee/Schedule'))->name('employee.schedule');
    Route::get('time-clock', fn() => Inertia::render('Employee/TimeClock'))->name('employee.time-clock');

    // Performance & Communication
    Route::get('performance', fn() => Inertia::render('Employee/Performance'))->name('employee.performance');
    Route::get('notifications', fn() => Inertia::render('Employee/Notifications'))->name('employee.notifications');

    // Support & Settings
    Route::get('support', fn() => Inertia::render('Employee/HelpSupport'))->name('employee.support');
    Route::get('feedback', fn() => Inertia::render('Employee/Feedback'))->name('employee.feedback');
    Route::get('settings', fn() => Inertia::render('Employee/Settings'))->name('employee.settings');
});

// ============================================================================
// ADMIN WEB ROUTES
// ============================================================================

// Support multiple admin roles: super-admin, admin, and specific manager roles
Route::prefix('admin')->middleware(['auth', 'role:super-admin,admin,manager,chief,service-manager,finance-manager,hr-manager,inventory-manager,operations-manager,viewer'])->group(function () {
    // Dashboard & Overview
    Route::get('dashboard', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'index'])->name('admin.dashboard');
    Route::get('dashboard/data', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'getData'])->name('admin.dashboard.data');

    Route::get('notifications', fn() => Inertia::render('admin/Notifications'))->name('admin.notifications');
    Route::get('my-notifications', fn() => Inertia::render('admin/MyNotifications'))->name('admin.my-notifications');
    Route::get('audit-logs', fn() => Inertia::render('admin/AuditLogs'))->name('admin.audit-logs');

    // Menu Management
    Route::get('categories', fn() => Inertia::render('admin/Categories'))->name('admin.categories');
    Route::get('menu-items', fn() => Inertia::render('admin/MenuItems'))->name('admin.menu-items');
    Route::get('recipes', fn() => Inertia::render('admin/Recipes'))->name('admin.recipes');

    // Orders & Tables
    Route::get('orders', fn() => Inertia::render('admin/Orders'))->name('admin.orders');
    Route::get('floors', fn() => Inertia::render('admin/Floors'))->name('admin.floors');
    Route::get('tables', fn() => Inertia::render('admin/Tables'))->name('admin.tables');
    Route::get('tables/print-qr-view', fn() => Inertia::render('admin/QrPrintView'))->name('admin.tables.print-qr');
    Route::get('reservations', fn() => Inertia::render('admin/Reservations'))->name('admin.reservations');



    // Finance
    Route::get('invoices', fn() => Inertia::render('admin/Invoices'))->name('admin.invoices');
    Route::get('payments', fn() => Inertia::render('admin/PaymentsDashboard'))->name('admin.payments');
    Route::get('expenses', fn() => Inertia::render('admin/Expenses'))->name('admin.expenses');
    Route::get('financial-dashboard', fn() => Inertia::render('admin/FinancialDashboard'))->name('admin.financial-dashboard');

    // Inventory & Procurement
    Route::get('inventory', fn() => Inertia::render('admin/Inventory'))->name('admin.inventory');
    Route::get('ingredients', fn() => Inertia::render('admin/Ingredients'))->name('admin.ingredients');
    Route::get('inventory-adjustments', fn() => Inertia::render('admin/InventoryAdjustments'))->name('admin.inventory-adjustments');
    Route::get('stock-alerts', fn() => Inertia::render('admin/StockAlerts'))->name('admin.stock-alerts');
    Route::get('suppliers', fn() => Inertia::render('admin/Suppliers'))->name('admin.suppliers');
    Route::get('purchase-orders', fn() => Inertia::render('admin/PurchaseOrders'))->name('admin.purchase-orders');
    Route::get('units', fn() => Inertia::render('admin/Units'))->name('admin.units');

    // HR & Employees
    Route::get('employees', fn() => Inertia::render('admin/Employees'))->name('admin.employees');
    Route::get('positions', fn() => Inertia::render('admin/Positions'))->name('admin.positions');
    Route::get('shifts', fn() => Inertia::render('admin/Shifts'))->name('admin.shifts');
    Route::get('shift-approvals', fn() => Inertia::render('admin/ManagerShiftApprovals'))->name('admin.shift-approvals');
    Route::get('time-off-requests', fn() => Inertia::render('admin/TimeOffRequests'))->name('admin.time-off-requests');
    Route::get('attendance-management', fn() => Inertia::render('admin/Employee/AttendanceManagement'))->name('admin.attendance-management');
    Route::get('payroll-management', fn() => Inertia::render('admin/Employee/PayrollManagement'))->name('admin.payroll-management');

    // CRM & Customers
    Route::get('customers', fn() => Inertia::render('admin/Customers'))->name('admin.customers');
    Route::get('loyalty-points', fn() => Inertia::render('admin/LoyaltyPoints'))->name('admin.loyalty-points');
    Route::get('promotions', fn() => Inertia::render('admin/Promotions'))->name('admin.promotions');

    // Analytics
    Route::get('sales-analytics', fn() => Inertia::render('admin/SalesAnalytics'))->name('admin.sales-analytics');

    // Standardized Reports Routes
    Route::get('reports/inventory/pdf', [\App\Http\Controllers\Admin\ReportController::class, 'inventory'])->name('admin.reports.inventory.pdf');
    Route::get('reports/sales/pdf', [\App\Http\Controllers\Admin\ReportController::class, 'sales'])->name('admin.reports.sales.pdf');

    // UI Routes for Reports
    Route::get('reports/inventory', fn() => Inertia::render('admin/Reports/InventoryReport'))->name('admin.reports.inventory');
    Route::get('reports/sales', fn() => Inertia::render('admin/Reports/SalesReport'))->name('admin.reports.sales');

    // Legacy Redirects or Aliases (Keeping for backward compat if menu links exist)
    Route::get('inventory-reports', fn() => redirect()->route('admin.reports.inventory'))->name('admin.inventory-reports');

    // System Settings
    Route::get('locations', fn() => Inertia::render('admin/Locations'))->name('admin.locations');
    Route::get('payment-methods', fn() => Inertia::render('admin/PaymentMethodManagement'))->name('admin.payment-methods');
    Route::get('operating-hours', fn() => Inertia::render('admin/OperatingHours'))->name('admin.operating-hours');
    Route::get('roles', fn() => Inertia::render('admin/Roles'))->name('admin.roles');
    Route::get('admins', fn() => Inertia::render('admin/Admins'))->name('admin.admins');
    Route::get('translations', fn() => Inertia::render('admin/Translations'))->name('admin.translations');

    // System Configuration (Lookup Tables)
    Route::get('configuration', [\App\Http\Controllers\Admin\LookupTableController::class, 'index'])->name('admin.configuration.index');
    Route::put('configuration/order-types/{orderType}', [\App\Http\Controllers\Admin\LookupTableController::class, 'updateOrderType'])->name('admin.configuration.order-types.update');
    Route::put('configuration/order-statuses/{orderStatus}', [\App\Http\Controllers\Admin\LookupTableController::class, 'updateOrderStatus'])->name('admin.configuration.order-statuses.update');
    Route::put('configuration/payment-statuses/{paymentStatus}', [\App\Http\Controllers\Admin\LookupTableController::class, 'updatePaymentStatus'])->name('admin.configuration.payment-statuses.update');
    Route::put('configuration/loyalty-tiers/{loyaltyTier}', [\App\Http\Controllers\Admin\LookupTableController::class, 'updateLoyaltyTier'])->name('admin.configuration.loyalty-tiers.update');

    Route::get('settings', fn() => Inertia::render('admin/Settings'))->name('admin.settings');

    //     // Inventory Management
    //     Route::get('inventory', [\App\Http\Controllers\Admin\InventoryController::class, 'index'])->name('admin.inventory.index');
    //     Route::post('inventory/adjust', [\App\Http\Controllers\Admin\InventoryController::class, 'adjust'])->name('admin.inventory.adjust');
    //     Route::post('inventory/wastage', [\App\Http\Controllers\Admin\InventoryController::class, 'wastage'])->name('admin.inventory.wastage');
});
Route::get('forgetPass', fn() => Inertia::render('Auth/ForgotPassword'))->name('auth.forgotpassword');
Route::get('VerifyEmail', fn() => Inertia::render('Auth/VerifyEmail'))->name('auth.verify_email');


// ============================================================================
// PROFILE ROUTES (Laravel Breeze)
// ============================================================================

// Route::middleware('auth')->group(function () {
//     Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
//     Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
//     Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
// });
Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
// ============================================================================
// AUTH ROUTES
// ============================================================================

require __DIR__ . '/auth.php';

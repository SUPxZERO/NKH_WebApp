<?php

use App\Http\Controllers\ProfileController;
use App\Models\Customer;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;


// Public route - Homepage with real data
Route::get('/', [App\Http\Controllers\HomeController::class, 'index'])->name('customer.home');

// Customer protected routes
Route::middleware(['auth', 'role:Customer'])->group(function () {
        Route::get('/dashboard', fn() => Inertia::render('Customer/Dashboard'))->name('customer.dashboard');
        Route::get('/menu', fn() => Inertia::render('Customer/Menu'))->name('customer.menu');
        Route::get('/cart', fn() => Inertia::render('Customer/Cart'))->name('customer.cart');
        Route::get('customer/orders', fn() => Inertia::render('Customer/Orders'))->name('customer.orders');
        Route::get('/orders/{order}', fn() => Inertia::render('Customer/OrderDetail'))->name('customer.order.detail');
        Route::get('/track/{orderId}', fn() => Inertia::render('Customer/OrderTracking'))->name('customer.order.track');
        Route::get('/restaurant', fn() => Inertia::render('Customer/RestaurantDashboard'))->name('customer.restaurant');
        Route::get('/checkout', fn() => Inertia::render('Customer/Checkout'))->name('customer.checkout');
        // Route::get('reservation', fn() => Inertia::render('Customer/Reservation'))->name('customer.reservation');
    });

// Route::get('/dashboard', fn () => Inertia::render('Customer/Dashboard'))->name('customer.dashboard');
// Route::get('/menu', fn () => Inertia::render('Customer/Menu'))->name('customer.menu');
// Route::get('/cart', fn () => Inertia::render('Customer/Cart'))->name('customer.cart');
// Route::get('/checkout', fn () => Inertia::render('Customer/Checkout'))->name('customer.checkout');
// Route::get('/orders/{order}', fn () => Inertia::render('Customer/OrderDetail'))->name('customer.order.detail');
// Route::get('/track/{orderId}', fn () => Inertia::render('Customer/OrderTracking'))->name('customer.order.track');

// Employee routes
Route::prefix('employee')->middleware(['auth', 'role:employee'])->group(function () {
    Route::get('pos', fn() => Inertia::render('Employee/POS'))->name('employee.pos');
    Route::get('schedule', fn() => Inertia::render('Employee/Schedule'))->name('employee.schedule');
    Route::get('kitchen', fn() => Inertia::render('Employee/KitchenDisplay'))->name('employee.kitchen');
});

// Admin routes
Route::prefix('admin')
    ->middleware(['auth', 'role:admin'])
    ->group(function () {
        Route::get('dashboard', fn() => Inertia::render('admin/Dashboard', [
            'analyticsEndpoint' => '/api/admin/dashboard/analytics',
            'orderStatsEndpoint' => '/api/admin/dashboard/orders/stats',
            'revenueEndpoint' => '/api/admin/dashboard/revenue',
        ]))->name('admin.dashboard');
        Route::get('notifications', fn() => Inertia::render('admin/Notifications'))->name('admin.notifications');
        Route::get('categories', fn() => Inertia::render('admin/Categories'))->name('admin.categories');
        Route::get('menu-items', fn() => Inertia::render('admin/MenuItems'))->name('admin.menu-items');
        Route::get('categories', fn() => Inertia::render('admin/Categories'))->name('admin.categories');
        Route::get('employees', fn() => Inertia::render('admin/Employees'))->name('admin.employees');
        Route::get('locations', fn() => Inertia::render('admin/Locations'))->name('admin.locations');
        Route::get('promotions', fn() => Inertia::render('admin/Promotions'))->name('admin.promotions');
        Route::get('customers', fn() => Inertia::render('admin/Customers'))->name('admin.customers');
        Route::get('loyalty-points', fn() => Inertia::render('admin/LoyaltyPoints'))->name('admin.loyalty-points');
        Route::get('orders', fn() => Inertia::render('admin/Orders'))->name('admin.orders');
        Route::get('inventory', fn() => Inertia::render('admin/Inventory'))->name('admin.inventory');
        Route::get('expenses', fn() => Inertia::render('admin/Expenses'))->name('admin.expenses');
        Route::get('floors', fn() => Inertia::render('admin/Floors'))->name('admin.floors');
        Route::get('tables', fn() => Inertia::render('admin/Tables'))->name('admin.tables');
        Route::get('invoices', fn() => Inertia::render('admin/Invoices'))->name('admin.invoices');
        Route::get('reservations', fn() => Inertia::render('admin/Reservations'))->name('admin.reservations');
        Route::get('audit-logs', fn() => Inertia::render('admin/AuditLogs'))->name('admin.audit-logs');
        Route::get('settings', fn() => Inertia::render('admin/Settings'))->name('admin.settings');
        
        // Sprint 1: Foundation Modules
        Route::get('suppliers', fn() => Inertia::render('admin/Suppliers'))->name('admin.suppliers');
        Route::get('positions', fn() => Inertia::render('admin/Positions'))->name('admin.positions');
        Route::get('units', fn() => Inertia::render('admin/Units'))->name('admin.units');
        
        // Sprint 2: Inventory & Procurement
        Route::get('purchase-orders', fn() => Inertia::render('admin/PurchaseOrders'))->name('admin.purchase-orders');
        Route::get('recipes', fn() => Inertia::render('admin/Recipes'))->name('admin.recipes');
        
        // Sprint 3: Employee Scheduling & Time Management
        Route::get('shifts', fn() => Inertia::render('admin/Shifts'))->name('admin.shifts');
        Route::get('time-off-requests', fn() => Inertia::render('admin/TimeOffRequests'))->name('admin.time-off-requests');
        Route::get('attendance-management', fn() => Inertia::render('admin/Employee/AttendanceManagement'))->name('admin.attendance-management');
        Route::get('payroll-management', fn() => Inertia::render('admin/Employee/PayrollManagement'))->name('admin.payroll-management');
        
        // Sprint 4: Ingredients & Inventory Management
        Route::get('ingredients', fn() => Inertia::render('admin/Ingredients'))->name('admin.ingredients');
        Route::get('inventory', fn() => Inertia::render('admin/Inventory'))->name('admin.inventory');
        Route::get('inventory-adjustments', fn() => Inertia::render('admin/InventoryAdjustments'))->name('admin.inventory-adjustments');
        Route::get('stock-alerts', fn() => Inertia::render('admin/StockAlerts'))->name('admin.stock-alerts');
        
        // Sprint 5: Analytics & Reporting
        Route::get('sales-analytics', fn() => Inertia::render('admin/SalesAnalytics'))->name('admin.sales-analytics');
        Route::get('inventory-reports', fn() => Inertia::render('admin/InventoryReports'))->name('admin.inventory-reports');
        Route::get('financial-dashboard', fn() => Inertia::render('admin/FinancialDashboard'))->name('admin.financial-dashboard');
        
        // Sprint 6: Configuration & Access Control
        Route::get('roles', fn() => Inertia::render('admin/Roles'))->name('admin.roles');
        Route::get('operating-hours', fn() => Inertia::render('admin/OperatingHours'))->name('admin.operating-hours');
        Route::get('translations', fn() => Inertia::render('admin/Translations'))->name('admin.translations');
        
        // Approval managed within main Orders page - no separate route needed
    });

// Customer Routes (authenticated)
Route::prefix('customer')->middleware('auth')->group(function () {
    Route::get('/profile', fn() => Inertia::render('Customer/Profile'))->name('customer.profile');
    Route::get('/orders', fn() => Inertia::render('Customer/Orders'))->name('customer.orders');
    Route::get('/loyalty', fn() => Inertia::render('Customer/Loyalty'))->name('customer.loyalty');
    Route::get('/reservations', fn() => Inertia::render('Customer/Reservations'))->name('customer.reservations');
    Route::get('/feedback', fn() => Inertia::render('Customer/Feedback'))->name('customer.feedback');
    Route::get('/settings', fn() => Inertia::render('Customer/Settings'))->name('customer.settings');
    Route::get('/help', fn() => Inertia::render('Customer/HelpSupport'))->name('customer.help');
});

Route::get('/test-auth', function() {
    return response()->json([
        'user' => Auth::user(),
        'id' => Auth::id(),
        'session' => session()->all(),
    ]);
})->middleware('auth');

// Customer API Routes (Moved from api.php to share session)
Route::prefix('api/customer')->middleware('auth')->group(function () {
    // Dashboard endpoints
    Route::get('profile', [App\Http\Controllers\Api\CustomerDashboardController::class, 'profile']);
    Route::put('profile', [App\Http\Controllers\Api\CustomerController::class, 'updateProfile']);
    Route::get('dashboard/stats', [App\Http\Controllers\Api\CustomerDashboardController::class, 'dashboardStats']);
    Route::get('orders', [App\Http\Controllers\Api\CustomerDashboardController::class, 'orders']);
    Route::get('favorites', [App\Http\Controllers\Api\CustomerDashboardController::class, 'favorites']);
    
    // CRM endpoints
    Route::get('stats', [App\Http\Controllers\Api\CustomerController::class, 'customerStats']);
    Route::get('history', [App\Http\Controllers\Api\CustomerController::class, 'customerHistory']);
    
    // Address Management
    Route::get('addresses', [App\Http\Controllers\Api\CustomerController::class, 'getAddresses']);
    Route::post('addresses', [App\Http\Controllers\Api\CustomerController::class, 'storeAddress']);
    Route::put('addresses/{address}', [App\Http\Controllers\Api\CustomerController::class, 'updateAddress']);
    Route::delete('addresses/{address}', [App\Http\Controllers\Api\CustomerController::class, 'destroyAddress']);
    Route::post('addresses/{address}/set-default', [App\Http\Controllers\Api\CustomerController::class, 'setDefaultAddress']);
    
    // Cart Management
    Route::get('cart', [App\Http\Controllers\Api\CartController::class, 'index']);
    Route::post('cart', [App\Http\Controllers\Api\CartController::class, 'store']);
    Route::put('cart/{cartItem}', [App\Http\Controllers\Api\CartController::class, 'update']);
    Route::delete('cart/{cartItem}', [App\Http\Controllers\Api\CartController::class, 'destroy']);
    Route::delete('cart', [App\Http\Controllers\Api\CartController::class, 'clear']);
    Route::post('cart/sync', [App\Http\Controllers\Api\CartController::class, 'sync']);
    
    // Online Orders
    Route::post('online-orders', [App\Http\Controllers\Api\OnlineOrderController::class, 'store']);
    
    // Reservations
    Route::get('reservations', [App\Http\Controllers\Api\CustomerReservationController::class, 'index']);
    Route::post('reservations', [App\Http\Controllers\Api\CustomerReservationController::class, 'store']);
    Route::get('reservations/availability', [App\Http\Controllers\Api\CustomerReservationController::class, 'availability']);
    Route::delete('reservations/{reservation}', [App\Http\Controllers\Api\CustomerReservationController::class, 'destroy']);
    
    // Rewards
    Route::get('rewards', [App\Http\Controllers\Api\RewardController::class, 'index']);
    Route::post('rewards/redeem', [App\Http\Controllers\Api\RewardController::class, 'redeem']);
    Route::get('rewards/history', [App\Http\Controllers\Api\RewardController::class, 'history']);
});

// User Profile API Routes (for all authenticated users - admin, employee)
Route::prefix('api/user')->middleware('auth')->group(function () {
    Route::put('profile', [App\Http\Controllers\Api\UserProfileController::class, 'update']);
    Route::post('change-password', [App\Http\Controllers\Api\UserProfileController::class, 'changePassword']);
});

// Test time slots seeder
Route::middleware('auth')->group(function () {
        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    });



require __DIR__ . '/auth.php';

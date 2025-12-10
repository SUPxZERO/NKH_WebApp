<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\MenuItemController;
use App\Http\Controllers\Api\TableController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\OnlineOrderController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\CustomerDashboardController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\EmployeeScheduleController;
use App\Http\Controllers\Api\EmployeeTimeOffController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\FloorController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\CustomerReservationController;
use App\Http\Controllers\Api\SettingController;
// CustomerRequestController removed - functionality consolidated to OrderController
use App\Http\Controllers\Api\PositionController;
use App\Http\Controllers\Api\PaymentWebhookController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\PromotionController;
use App\Http\Controllers\Api\LoyaltyPointController;
use App\Http\Controllers\Api\IngredientController;
use App\Http\Controllers\Api\ExpenseCategoryController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\OrderHoldController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\UnitController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\RecipeController;
use App\Http\Controllers\Api\ShiftController;
use App\Http\Controllers\Api\TimeOffRequestController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\InventoryAdjustmentController;
use App\Http\Controllers\Api\StockAlertController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\ReportsController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\OperatingHoursController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\TranslationController;
use App\Http\Controllers\Api\PayrollController;
use App\Http\Controllers\Api\TimeSlotController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\UserProfileController;
use Illuminate\Http\Request;

// Health check endpoint for Docker/Render
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
        'database' => DB::connection()->getDatabaseName()
    ]);
});

// User Profile Routes - MOVED TO web.php to share session properly
// Route::prefix('user')
//     ->middleware([\Illuminate\Session\Middleware\StartSession::class, 'auth:sanctum'])
//     ->group(function () {
//     Route::put('profile', [UserProfileController::class, 'update']);
//     Route::post('profile/avatar', [UserProfileController::class, 'uploadAvatar']);
//     Route::delete('profile/avatar', [UserProfileController::class, 'deleteAvatar']);
//     Route::get('profile/avatar', [UserProfileController::class, 'getAvatarUrl']);
//     Route::post('change-password', [UserProfileController::class, 'changePassword']);
// });

// Public endpoints
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{category}', [CategoryController::class, 'show']);

// Menu Items CRUD routes
Route::controller(MenuItemController::class)->group(function () {
    Route::get('/menu-items', 'index');
    Route::post('/menu-items', 'store');
    Route::get('/menu-items/{menuItem}', 'show');
    Route::match(['put', 'patch'], '/menu-items/{menuItem}', 'update');
    Route::delete('/menu-items/{menuItem}', 'destroy');
});

Route::get('/time-slots', [OnlineOrderController::class, 'timeSlots']);

// New public menu route
Route::get('/menu', [MenuItemController::class, 'index']);

// Payment webhooks (secure with signature verification in production)
Route::post('/payments/webhook/success', [PaymentWebhookController::class, 'handleSuccess']);
    // ->middleware('payment.rate:webhook');
Route::post('/webhooks/payment', [PaymentWebhookController::class, 'handle']);
    // ->middleware('payment.rate:webhook');

// Payment endpoints
Route::prefix('payments')->group(function () {
    Route::post('/initiate', [\App\Http\Controllers\Api\PaymentController::class, 'initiate']);
        // ->middleware('payment.rate:initiate');
    Route::get('/{payment}/status', [\App\Http\Controllers\Api\PaymentController::class, 'status']);
        // ->middleware('payment.rate:status');
    Route::get('/uuid/{uuid}', [\App\Http\Controllers\Api\PaymentController::class, 'showByUuid']);
        // ->middleware('payment.rate:status');
    Route::get('/{payment}/qr', [\App\Http\Controllers\Api\PaymentController::class, 'getQrCode']);
        // ->middleware('payment.rate:status');
    Route::post('/{payment}/cancel', [\App\Http\Controllers\Api\PaymentController::class, 'cancel']);
        // ->middleware('payment.rate:default');
    Route::post('/{payment}/retry', [\App\Http\Controllers\Api\PaymentController::class, 'retry']);
        // ->middleware('payment.rate:initiate');
    
    // Development/testing only routes
    Route::post('/{payment}/simulate-success', [\App\Http\Controllers\Api\PaymentController::class, 'simulateSuccess']);
        // ->middleware('payment.rate:simulate');
    Route::post('/{payment}/simulate-failure', [\App\Http\Controllers\Api\PaymentController::class, 'simulateFailure']);
        // ->middleware('payment.rate:simulate');
});

// Public reference data
Route::get('/positions', [PositionController::class, 'index']);
Route::get('/locations', [LocationController::class, 'index']);

// Time slots
Route::get('/timeslots', [TimeSlotController::class, 'index']);
Route::get('/timeslots/stats', [TimeSlotController::class, 'stats']);
Route::post('/timeslots/regenerate', [TimeSlotController::class, 'regenerate']);
// ->middleware('auth');
Route::post('/timeslots/cleanup', [TimeSlotController::class, 'cleanup']);
// ->middleware('auth');

// Sprint 1: Suppliers & Units (CRUD accessible to all for now)
Route::apiResource('suppliers', SupplierController::class);
Route::get('/suppliers/types', [SupplierController::class, 'types']);
Route::get('/supplier-stats', [SupplierController::class, 'stats']);
Route::apiResource('units', UnitController::class);
Route::get('/units/base-units', [UnitController::class, 'baseUnits']);

// Debug endpoint to inspect auth in API context (remove after troubleshooting)
Route::get('/_debug/auth', function (Request $request) {
    return response()->json([
        'guard_default' => config('auth.defaults.guard'),
        'guards' => [
            'web' => auth('web')->check(),
            'sanctum' => auth('sanctum')->check(),
        ],
        'auth_check' => auth()->check(),
        'user_id' => optional($request->user())->id,
        'session_id' => session()->getId(),
        'session_cookie_name' => config('session.cookie'),
        'session_domain' => config('session.domain'),
        'stateful' => config('sanctum.stateful'),
        'cookies' => $request->cookies->all(),
        'headers' => $request->headers->all(),
    ]);
});


// Authenticated routes
// NOTE: authentication is required for these routes. Enable Sanctum guard so
// $request->user() is available for controllers that rely on the authenticated user.
// Route::group([
//     'middleware' => ['auth:sanctum']
// ], function () {
//     Route::get('/user', [AuthController::class, 'me']);
//     Route::post('/logout', [AuthController::class, 'logout']);

//     // Admin/Manager management endpoints
//     Route::prefix('admin')
//     // Apply role-based restriction to admin endpoints (requires auth:sanctum on outer group)
//     ->middleware(['role:admin,manager'])
//     ->group(function () {
//             Route::get('/category-stats', [CategoryController::class, 'stats']);
//             Route::get('/categories/hierarchy', [CategoryController::class, 'hierarchy']);
//             Route::get('/categories', [CategoryController::class, 'index']);
//             Route::post('/categories', [CategoryController::class, 'store']);
//             Route::get('/categories/{category}', [CategoryController::class, 'show']);
//             Route::put('/categories/{category}', [CategoryController::class, 'update']);
//             Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);
//         Route::put('categories/{category}/toggle-status', [CategoryController::class, 'toggleStatus']);
//         // Menu Items
//         Route::apiResource('menu-items', MenuItemController::class);
//         // Employees
//         Route::apiResource('employees', EmployeeController::class);
//         // Customers
//         Route::apiResource('customers', CustomerController::class);
//         // Expenses
//         Route::apiResource('expenses', ExpenseController::class);
//         // Floors
//         Route::apiResource('floors', FloorController::class);
//         // Tables
//         Route::apiResource('tables', TableController::class);
//         Route::patch('tables/{table}/status', [TableController::class, 'updateStatus']);
//         // Invoices
//         Route::get('invoices', [InvoiceController::class, 'index']);
//         Route::get('invoices/{invoice}', [InvoiceController::class, 'show']);
//         // Reservations
//         Route::apiResource('reservations', ReservationController::class);
//         // Settings
//         Route::get('settings', [SettingController::class, 'index']);
//         Route::put('settings', [SettingController::class, 'update']);
//         // Customer Requests
//         Route::get('customer-requests', [CustomerRequestController::class, 'index']);
//         Route::get('customer-requests/{customerRequest}', [CustomerRequestController::class, 'show']);
//         Route::patch('customer-requests/{customerRequest}', [CustomerRequestController::class, 'update']);

//         // Dashboard
//         Route::get('dashboard/analytics', [AdminDashboardController::class, 'analytics']);
//         Route::get('dashboard/orders/stats', [AdminDashboardController::class, 'orderStats']);
//         Route::get('dashboard/revenue/{period}', [AdminDashboardController::class, 'revenue'])->where('period', 'daily|weekly|monthly');

//         // Order oversight and approvals
//         Route::get('orders', [OrderController::class, 'index']); // Assuming an index method for admin
//         Route::patch('orders/{order}/approve', [OrderController::class, 'approve']);
//         // ->middleware('auth','role:admin,manager');
//         Route::patch('orders/{order}/reject', [OrderController::class, 'reject']);
//         // ->middleware('auth','role:admin,manager');
//     });

    


//     // In-store operations for staff (Employee)
//     Route::prefix('employee')
//     ->middleware('role:admin,manager,waiter')
//     ->group(function () {
//         // POS menu
//         Route::get('menu', [MenuItemController::class, 'index']);
//         // POS Orders (dine-in, auto-approved)
//         Route::post('orders', [OrderController::class, 'store']);
//         Route::get('orders/{order}', [OrderController::class, 'show']);
//         Route::post('orders/{order}/items', [OrderController::class, 'addItem']);
//         Route::put('order-items/{orderItem}', [OrderController::class, 'updateItem']);
//         Route::delete('order-items/{orderItem}', [OrderController::class, 'removeItem']);
//         Route::post('orders/{order}/submit', [OrderController::class, 'submitToKitchen']);
//     });

//     // Customer self-service
//     Route::
//         middleware('role:customer')
//         ->group(function () {
//         Route::get('/customer/profile', [CustomerController::class, 'profile']);
//         Route::get('/customer/orders', [CustomerController::class, 'orders']);
//         Route::get('/customer/orders/{order}', [OnlineOrderController::class, 'show']); // Customer can view their own order
//         Route::get('/customer/loyalty-points', [CustomerController::class, 'loyaltyPoints']);

//         Route::get('/customer/addresses', [OnlineOrderController::class, 'addressesIndex']);
//         Route::post('/customer/addresses', [OnlineOrderController::class, 'addressesStore']);

//         // Customer online orders (pickup/delivery, requires approval)
//         Route::post('/online-orders', [OnlineOrderController::class, 'store']);
//     });

//     // Customer online orders (pickup/delivery, requires approval)
//     Route::post('/online-orders', [OnlineOrderController::class, 'store']);


// });


Route::get('/user', [AuthController::class, 'me'])->middleware([\Illuminate\Session\Middleware\StartSession::class, 'auth:sanctum']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware([\Illuminate\Session\Middleware\StartSession::class, 'auth:sanctum']);

// Admin routes - always need session for user() to work, auth is optional in local
$adminMiddleware = [
    \Illuminate\Session\Middleware\StartSession::class,
    \Illuminate\View\Middleware\ShareErrorsFromSession::class,
];

// In production, enforce authentication
if (config('app.enforce_admin_auth') || app()->environment('production')) {
    $adminMiddleware[] = 'auth:sanctum';
    $adminMiddleware[] = 'role:admin,manager';
}

// Admin/Manager management endpoints
Route::prefix('admin')
    // ->middleware($adminMiddleware)
    ->group(function () {
        Route::get('/category-stats', [CategoryController::class, 'stats']);
        // Alias to match frontend caller
        Route::get('/categories/stats', [CategoryController::class, 'stats']);
        Route::get('/categories/hierarchy', [CategoryController::class, 'hierarchy']);
        Route::get('/categories', [CategoryController::class, 'index']);
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::get('/categories/{category}', [CategoryController::class, 'show']);
        Route::put('/categories/{category}', [CategoryController::class, 'update']);
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);
    Route::put('categories/{category}/toggle-status', [CategoryController::class, 'toggleStatus']);
    // Menu Items
    Route::apiResource('menu-items', MenuItemController::class);
    // Employees
    Route::get('employee-stats', [EmployeeController::class, 'stats']);
    Route::apiResource('employees', EmployeeController::class);
    // Customers
    Route::get('customer-stats', [CustomerController::class, 'aggregateStats']);
    Route::get('customers/{customer}/history', [CustomerController::class, 'history']);
    Route::get('customers/{customer}/stats', [CustomerController::class, 'stats']);
    Route::post('customers/{customer}/update-tier', [CustomerController::class, 'updateTier']);
    Route::apiResource('customers', CustomerController::class);
    // Expenses
    Route::apiResource('expenses', ExpenseController::class);
    Route::get('expense-categories', [ExpenseCategoryController::class, 'index']);
    // Floors
    Route::apiResource('floors', FloorController::class);
    // Promotions
    Route::get('promotion-stats', [PromotionController::class, 'stats']);
    Route::apiResource('promotions', PromotionController::class);
    // Loyalty Points
    Route::get('loyalty-stats', [LoyaltyPointController::class, 'stats']);
    Route::apiResource('loyalty-points', LoyaltyPointController::class);
    // Ingredients (Inventory) - Moved to Sprint 4 section to avoid route conflict
    // Route::apiResource('ingredients', IngredientController::class);
    // Tables
    Route::get('tables/grouped', [\App\Http\Controllers\Admin\TableController::class, 'index']);
    Route::apiResource('tables', TableController::class);
    Route::patch('tables/{table}/status', [TableController::class, 'updateStatus']);
    // Audit Logs
    Route::get('audit-logs', [AuditLogController::class, 'index']);
    Route::get('audit-stats', [AuditLogController::class, 'stats']);
    // Invoices
    Route::get('invoices', [InvoiceController::class, 'index']);
    Route::get('invoices/{invoice}', [InvoiceController::class, 'show']);
    // Reservations
    Route::apiResource('reservations', ReservationController::class);
    // Settings
    Route::get('settings', [SettingController::class, 'index']);
    Route::put('settings', [SettingController::class, 'update']);
    // Order oversight and approvals
    Route::get('orders', [OrderController::class, 'index']);
    Route::get('orders/pending-approval', [OrderController::class, 'pendingApproval']); // Replaces customer-requests

    // Dashboard
    Route::get('dashboard/analytics', [AdminDashboardController::class, 'analytics']);
    Route::get('dashboard/orders/stats', [AdminDashboardController::class, 'orderStats']);
    Route::get('dashboard/revenue/{period}', [AdminDashboardController::class, 'revenue'])->where('period', 'daily|weekly|monthly');

    Route::put('orders/{order}/status', [OrderController::class, 'updateStatus']);
    Route::delete('orders/{order}', [OrderController::class, 'destroy']);
    Route::patch('orders/{order}/approve', [OrderController::class, 'approve']);
    Route::patch('orders/{order}/reject', [OrderController::class, 'reject']);
    
    // Sprint 1: Foundation Modules
    // Locations (full CRUD for admin)
    Route::get('locations', [LocationController::class, 'adminIndex']);
    Route::post('locations', [LocationController::class, 'store']);
    Route::get('locations/{location}', [LocationController::class, 'show']);
    Route::put('locations/{location}', [LocationController::class, 'update']);
    Route::delete('locations/{location}', [LocationController::class, 'destroy']);
    
    // Positions (enhanced admin endpoint)
    Route::get('positions', [PositionController::class, 'adminIndex']);
    
    // Sprint 2: Inventory & Procurement
    // Purchase Orders
    Route::apiResource('purchase-orders', PurchaseOrderController::class);
    Route::post('purchase-orders/{purchaseOrder}/approve', [PurchaseOrderController::class, 'approve']);
    Route::post('purchase-orders/{purchaseOrder}/mark-ordered', [PurchaseOrderController::class, 'markOrdered']);
    Route::post('purchase-orders/{purchaseOrder}/receive', [PurchaseOrderController::class, 'receive']);
    Route::post('purchase-orders/{purchaseOrder}/cancel', [PurchaseOrderController::class, 'cancel']);
    Route::get('purchase-orders-stats', [PurchaseOrderController::class, 'stats']);
    
    // Recipes
    Route::apiResource('recipes', RecipeController::class);
    Route::post('recipes/{recipe}/duplicate', [RecipeController::class, 'duplicate']);
    Route::get('recipes/{recipe}/costing', [RecipeController::class, 'costing']);
    Route::get('recipes-stats', [RecipeController::class, 'stats']);
    
    // Sprint 3: Employee Scheduling & Time Management
    // Shifts
    Route::apiResource('shifts', ShiftController::class);
    Route::get('schedule', [ShiftController::class, 'schedule']);
    Route::post('shifts/publish', [ShiftController::class, 'publish']);
    Route::post('shifts/conflicts', [ShiftController::class, 'conflicts']);
    Route::get('shifts/stats', [ShiftController::class, 'stats']);
    Route::post('shifts/copy', [ShiftController::class, 'copy']);
    
    // Time Off Requests
    Route::apiResource('time-off-requests', TimeOffRequestController::class);
    Route::post('time-off-requests/{timeOffRequest}/approve', [TimeOffRequestController::class, 'approve']);
    Route::post('time-off-requests/{timeOffRequest}/reject', [TimeOffRequestController::class, 'reject']);
    Route::get('time-off-balance/{employee}', [TimeOffRequestController::class, 'balance']);
    Route::get('time-off-requests/stats', [TimeOffRequestController::class, 'stats']);
    Route::get('time-off-calendar', [TimeOffRequestController::class, 'calendar']);
    
    // Sprint 4: Ingredients & Inventory Management
    // Ingredients
    Route::get('ingredients/categories', [IngredientController::class, 'categories']);
    Route::get('ingredients/stats', [IngredientController::class, 'stats']);
    Route::get('ingredients/low-stock', [IngredientController::class, 'lowStock']);
    Route::get('ingredients/{ingredient}/cost-history', [IngredientController::class, 'costHistory']);
    Route::apiResource('ingredients', IngredientController::class);
    
    // Inventory
    // Inventory
    Route::get('inventory', [InventoryController::class, 'index']);
    Route::post('inventory/transfer', [InventoryController::class, 'transfer']);
    Route::post('inventory/wastage', [InventoryController::class, 'recordWastage']);
    Route::get('inventory/valuation', [InventoryController::class, 'valuation']);
    Route::get('inventory/stats', [InventoryController::class, 'stats']);
    Route::get('inventory/movements/{ingredient}', [InventoryController::class, 'movements']);
    Route::get('inventory/{ingredient}', [InventoryController::class, 'show']);
    
    // Inventory Adjustments
    Route::get('inventory-adjustments/stats', [InventoryAdjustmentController::class, 'stats']);
    Route::apiResource('inventory-adjustments', InventoryAdjustmentController::class);
    Route::post('inventory-adjustments/{adjustment}/approve', [InventoryAdjustmentController::class, 'approve']);
    Route::post('inventory-adjustments/{adjustment}/reject', [InventoryAdjustmentController::class, 'reject']);
    
    // Stock Alerts
    Route::get('stock-alerts', [StockAlertController::class, 'index']);
    Route::post('stock-alerts/{alert}/acknowledge', [StockAlertController::class, 'acknowledge']);
    Route::get('stock-alerts/reorder-recommendations', [StockAlertController::class, 'reorderRecommendations']);
    Route::put('stock-alerts/thresholds/{ingredient}', [StockAlertController::class, 'updateThresholds']);
    Route::get('stock-alerts/stats', [StockAlertController::class, 'stats']);
    
    // Sprint 5: Analytics & Reporting
    Route::prefix('analytics')->group(function () {
        Route::get('sales/overview', [AnalyticsController::class, 'salesOverview']);
        Route::get('sales/trends', [AnalyticsController::class, 'salesTrends']);
        Route::get('sales/top-items', [AnalyticsController::class, 'topSellingItems']);
        Route::get('sales/by-category', [AnalyticsController::class, 'salesByCategory']);
        Route::get('sales/peak-hours', [AnalyticsController::class, 'peakHours']);
        Route::get('sales/by-payment-method', [AnalyticsController::class, 'salesByPaymentMethod']);
        Route::get('sales/customer-metrics', [AnalyticsController::class, 'customerMetrics']);
        Route::get('sales/daily-summary', [AnalyticsController::class, 'dailySummary']);
        
        // Export routes
        Route::get('sales/export/pdf', [AnalyticsController::class, 'exportSalesPDF']);
        Route::get('sales/export/excel', [AnalyticsController::class, 'exportSalesExcel']);
    });
    
    // Reports
    Route::prefix('reports')->group(function () {
        // Inventory Reports
        Route::get('inventory/valuation', [ReportsController::class, 'inventoryValuation']);
        Route::get('inventory/usage-rates', [ReportsController::class, 'usageRates']);
        Route::get('inventory/waste-tracking', [ReportsController::class, 'wasteTracking']);
        Route::get('inventory/cost-analysis', [ReportsController::class, 'costAnalysis']);
        Route::get('inventory/turnover', [ReportsController::class, 'inventoryTurnover']);
        Route::get('inventory/export/pdf', [AnalyticsController::class, 'exportInventoryPDF']);
        Route::get('inventory/export/csv', [AnalyticsController::class, 'exportInventoryCSV']);
        
        // Financial Reports
        Route::get('financial/profit-loss', [ReportsController::class, 'profitLoss']);
        Route::get('financial/revenue-expenses', [ReportsController::class, 'revenueExpenses']);
        Route::get('financial/cogs', [ReportsController::class, 'cogs']);
        Route::get('financial/margins', [ReportsController::class, 'margins']);
        Route::get('financial/export/pdf', [AnalyticsController::class, 'exportFinancialPDF']);
        Route::get('financial/export/csv', [AnalyticsController::class, 'exportFinancialCSV']);
    });


    // Attendance & Time Clock (NEW)
    Route::post('attendance/clock-in', [AttendanceController::class, 'clockIn']);
    Route::post('attendance/clock-out', [AttendanceController::class, 'clockOut']);
    Route::get('attendance/today', [AttendanceController::class, 'today']);

    // Sprint 6: Access Control
    Route::apiResource('roles', RoleController::class);
    Route::get('permissions/all', [RoleController::class, 'getAllPermissions']);
    
    // Admin User Management
    Route::get('admin-users/stats', [\App\Http\Controllers\Api\AdminUserController::class, 'stats']);
    Route::apiResource('admin-users', \App\Http\Controllers\Api\AdminUserController::class);
    
    // Sprint 6: Operating Hours
    Route::get('operating-hours/location/{location}', [OperatingHoursController::class, 'getByLocation']);
    Route::post('operating-hours/bulk-update', [OperatingHoursController::class, 'bulkUpdate']);
    Route::post('operating-hours/copy-to-all-days', [OperatingHoursController::class, 'copyToAllDays']);
    Route::apiResource('operating-hours', OperatingHoursController::class);
    
    // Sprint 6: Settings
    Route::get('settings/key/{key}', [SettingsController::class, 'getByKey']);
    Route::post('settings/bulk-update', [SettingsController::class, 'bulkUpdate']);
    Route::apiResource('settings', SettingsController::class);
    
    // Sprint 6: Translations
    Route::get('translations/categories', [TranslationController::class, 'getCategoryTranslations']);
    Route::get('translations/menu-items', [TranslationController::class, 'getMenuItemTranslations']);
    Route::get('translations/missing', [TranslationController::class, 'getMissingTranslations']);
    Route::put('translations/category/{category}', [TranslationController::class, 'updateCategoryTranslation']);
    Route::put('translations/menu-item/{menuItem}', [TranslationController::class, 'updateMenuItemTranslation']);
    Route::post('translations/bulk-update', [TranslationController::class, 'bulkUpdateTranslations']);
    Route::get('attendance/history', [AttendanceController::class, 'history']);
    Route::post('attendance/{attendance}/adjust', [AttendanceController::class, 'adjust']);

    // Payroll Management (NEW)
    Route::post('payroll/generate', [PayrollController::class, 'generate']);
    Route::post('payroll/{payroll}/finalize', [PayrollController::class, 'finalize']);
    Route::get('payroll/history', [PayrollController::class, 'history']);
    Route::get('payroll/{payroll}/details', [PayrollController::class, 'details']);
    Route::post('payroll/{payroll}/add-detail', [PayrollController::class, 'addDetail']);
    Route::delete('payroll-details/{detail}', [PayrollController::class, 'removeDetail']);

    // Notifications
    Route::get('notifications/stats', [NotificationController::class, 'stats']);
    Route::put('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::apiResource('notifications', NotificationController::class);
    
    // Targeted Notifications (Admin UI for sending)
    Route::prefix('notifications/targeted')->group(function () {
        Route::get('options', [\App\Http\Controllers\Api\TargetedNotificationController::class, 'options']);
        Route::post('preview', [\App\Http\Controllers\Api\TargetedNotificationController::class, 'preview']);
        Route::post('send', [\App\Http\Controllers\Api\TargetedNotificationController::class, 'send']);
        Route::post('send-to-roles', [\App\Http\Controllers\Api\TargetedNotificationController::class, 'sendToRoles']);
        Route::post('send-to-users', [\App\Http\Controllers\Api\TargetedNotificationController::class, 'sendToUsers']);
        Route::get('search-users', [\App\Http\Controllers\Api\TargetedNotificationController::class, 'searchUsers']);
    });
    
    // Payment Management (Sprint 5)
    Route::prefix('payments')->group(function () {
        Route::get('stats', [\App\Http\Controllers\Api\Admin\PaymentAdminController::class, 'stats']);
        Route::get('/', [\App\Http\Controllers\Api\Admin\PaymentAdminController::class, 'index']);
        Route::get('{payment}', [\App\Http\Controllers\Api\Admin\PaymentAdminController::class, 'show']);
        Route::get('{payment}/audit-log', [\App\Http\Controllers\Api\Admin\PaymentAdminController::class, 'auditLog']);
        Route::get('revenue/chart', [\App\Http\Controllers\Api\Admin\PaymentAdminController::class, 'revenueChart']);
    });
    
    // Refund Management
    Route::prefix('refunds')->group(function () {
        Route::get('stats', [\App\Http\Controllers\Api\Admin\PaymentAdminController::class, 'refundStats']);
        Route::get('/', [\App\Http\Controllers\Api\Admin\PaymentAdminController::class, 'refunds']);
        Route::post('{refund}/approve', [\App\Http\Controllers\Api\Admin\PaymentAdminController::class, 'approveRefund']);
        Route::post('{refund}/reject', [\App\Http\Controllers\Api\Admin\PaymentAdminController::class, 'rejectRefund']);
    });
    
    // Settlement Management
    Route::prefix('settlements')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\Admin\PaymentAdminController::class, 'settlements']);
        Route::post('{settlement}/reconcile', [\App\Http\Controllers\Api\Admin\PaymentAdminController::class, 'reconcileSettlement']);
    });
});

// In-store operations for staff (Employee)
Route::prefix('employee')
// ->middleware([\Illuminate\Session\Middleware\StartSession::class, 'auth:sanctum', 'role:admin,manager,waiter'])
->group(function () {
    // POS menu
    Route::get('menu', [MenuItemController::class, 'index']);
    // POS Orders (dine-in, auto-approved)
    Route::post('orders', [OrderController::class, 'store']);
    Route::get('orders/{order}', [OrderController::class, 'show']);
    Route::post('orders/{order}/items', [OrderController::class, 'addItem']);
    Route::put('order-items/{orderItem}', [OrderController::class, 'updateItem']);
    
    // Employee Schedule
    Route::get('shifts', [EmployeeScheduleController::class, 'shifts']);
    Route::get('shifts/{id}', [EmployeeScheduleController::class, 'showShift']);
    
    // Time Off Requests
    Route::get('time-off-requests', [EmployeeTimeOffController::class, 'index']);
    Route::post('time-off-requests', [EmployeeTimeOffController::class, 'store']);
    Route::delete('time-off-requests/{id}', [EmployeeTimeOffController::class, 'destroy']);
});

// Customer Dashboard Routes - MOVED TO WEB.PHP to share session state
// See routes/web.php for 'api/customer' routes

// Order Holds
Route::prefix('order-holds')
    // ->middleware(['auth:sanctum'])
    ->group(function () {
        Route::get('/', [OrderHoldController::class, 'index']);
        Route::post('/', [OrderHoldController::class, 'store']);
        Route::delete('{id}', [OrderHoldController::class, 'destroy']);
    });
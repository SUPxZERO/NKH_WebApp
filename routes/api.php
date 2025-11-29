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
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\PayrollController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use Illuminate\Http\Request;

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

// Public reference data
Route::get('/positions', [PositionController::class, 'index']);
Route::get('/locations', [LocationController::class, 'index']);

// Sprint 1: Suppliers & Units (CRUD accessible to all for now)
Route::apiResource('suppliers', SupplierController::class);
Route::get('/suppliers/types', [SupplierController::class, 'types']);
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

// Conditionally enforce admin auth in non-local environments
$adminMiddleware = config('app.enforce_admin_auth')
    ? [\Illuminate\Session\Middleware\StartSession::class, 'auth:sanctum', 'role:admin,manager']
    : [];

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
    Route::apiResource('employees', EmployeeController::class);
    // Customers
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
    // Ingredients (Inventory)
    Route::apiResource('ingredients', IngredientController::class);
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
    // Locations (enhanced admin endpoint)
    Route::get('locations', [LocationController::class, 'adminIndex']);
    
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


    // Attendance & Time Clock (NEW)
    Route::post('attendance/clock-in', [AttendanceController::class, 'clockIn']);
    Route::post('attendance/clock-out', [AttendanceController::class, 'clockOut']);
    Route::get('attendance/today', [AttendanceController::class, 'today']);
    Route::get('attendance/history', [AttendanceController::class, 'history']);
    Route::post('attendance/{attendance}/adjust', [AttendanceController::class, 'adjust']);

    // Payroll Management (NEW)
    Route::post('payroll/generate', [PayrollController::class, 'generate']);
    Route::post('payroll/{payroll}/finalize', [PayrollController::class, 'finalize']);
    Route::get('payroll/history', [PayrollController::class, 'history']);
    Route::get('payroll/{payroll}/details', [PayrollController::class, 'details']);
    Route::post('payroll/{payroll}/add-detail', [PayrollController::class, 'addDetail']);
    Route::delete('payroll-details/{detail}', [PayrollController::class, 'removeDetail']);
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

// Customer Dashboard Routes (for authenticated customers)
Route::prefix('customer')
    // ->middleware([\Illuminate\Session\Middleware\StartSession::class, 'auth:sanctum'])
    ->group(function () {
    // Dashboard endpoints
    Route::get('profile', [CustomerDashboardController::class, 'profile']);
    Route::get('dashboard/stats', [CustomerDashboardController::class, 'dashboardStats']);
    Route::get('orders', [CustomerDashboardController::class, 'orders']);
    Route::get('favorites', [CustomerDashboardController::class, 'favorites']);
    
    // Addresses
    Route::get('addresses', [OnlineOrderController::class, 'addressesIndex']);
    Route::post('addresses', [OnlineOrderController::class, 'addressesStore']);
    
    // Cart Management
    Route::get('cart', [CartController::class, 'index']);
    Route::post('cart', [CartController::class, 'store']);
    Route::put('cart/{cartItem}', [CartController::class, 'update']);
    Route::delete('cart/{cartItem}', [CartController::class, 'destroy']);
    Route::delete('cart', [CartController::class, 'clear']);
    Route::post('cart/sync', [CartController::class, 'sync']);
    
    // **CRITICAL FIX: Enable online orders endpoint**
    Route::post('online-orders', [OnlineOrderController::class, 'store']);

    // Reservations (customer self-service)
    Route::get('reservations', [CustomerReservationController::class, 'index']);
    Route::get('reservations/availability', [CustomerReservationController::class, 'availability']);
    Route::post('reservations', [CustomerReservationController::class, 'store']);
    Route::delete('reservations/{reservation}', [CustomerReservationController::class, 'destroy']);
});

// Order Holds
Route::prefix('order-holds')
    // ->middleware(['auth:sanctum'])
    ->group(function () {
        Route::get('/', [OrderHoldController::class, 'index']);
        Route::post('/', [OrderHoldController::class, 'store']);
        Route::delete('{id}', [OrderHoldController::class, 'destroy']);
    });
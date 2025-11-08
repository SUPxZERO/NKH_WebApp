<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\MenuItemController;
use App\Http\Controllers\Api\TableController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\OnlineOrderController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\FloorController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\CustomerRequestController;
use App\Http\Controllers\Api\PositionController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\DashboardController;

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

// Public reference data
Route::get('/positions', [PositionController::class, 'index']);
Route::get('/locations', [LocationController::class, 'index']);


// Authenticated routes
// NOTE: authentication is required for these routes. Enable Sanctum guard so
// $request->user() is available for controllers that rely on the authenticated user.
Route::group([
    'middle  ware' => 
    ['auth:sanctum']], function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Admin/Manager management endpoints
    Route::prefix('admin')
    // Apply role-based restriction to admin endpoints (requires auth:sanctum on outer group)
    ->middleware(['role:admin,manager'])
    ->group(function () {
            // Categories (with hierarchy support)
            Route::get('/categories/hierarchy', [CategoryController::class, 'hierarchy']);
            Route::get('/category-stats', [CategoryController::class, 'stats']);
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
        // Floors
        Route::apiResource('floors', FloorController::class);
        // Tables
        Route::apiResource('tables', TableController::class);
        Route::patch('tables/{table}/status', [TableController::class, 'updateStatus']);
        // Invoices
        Route::get('invoices', [InvoiceController::class, 'index']);
        Route::get('invoices/{invoice}', [InvoiceController::class, 'show']);
        // Reservations
        Route::apiResource('reservations', ReservationController::class);
        // Settings
        Route::get('settings', [SettingController::class, 'index']);
        Route::put('settings', [SettingController::class, 'update']);
        // Customer Requests
        Route::get('customer-requests', [CustomerRequestController::class, 'index']);
        Route::get('customer-requests/{customerRequest}', [CustomerRequestController::class, 'show']);
        Route::patch('customer-requests/{customerRequest}', [CustomerRequestController::class, 'update']);

        // Dashboard
        Route::get('dashboard/analytics', [DashboardController::class, 'analytics']);
        Route::get('dashboard/orders/stats', [DashboardController::class, 'orderStats']);
        Route::get('dashboard/revenue/{period}', [DashboardController::class, 'revenue'])->where('period', 'daily|weekly|monthly');

        // Order oversight and approvals
        Route::get('orders', [OrderController::class, 'index']); // Assuming an index method for admin
        Route::patch('orders/{order}/approve', [OrderController::class, 'approve']);
        // ->middleware('role:admin,manager');
        Route::patch('orders/{order}/reject', [OrderController::class, 'reject']);
        // ->middleware('role:admin,manager');
    });


    // In-store operations for staff (Employee)
    Route::prefix('employee')
    // ->middleware('role:admin,manager,waiter')
    ->group(function () {
        // POS menu
        Route::get('menu', [MenuItemController::class, 'index']);
        // POS Orders (dine-in, auto-approved)
        Route::post('orders', [OrderController::class, 'store']);
        Route::get('orders/{order}', [OrderController::class, 'show']);
        Route::post('orders/{order}/items', [OrderController::class, 'addItem']);
        Route::put('order-items/{orderItem}', [OrderController::class, 'updateItem']);
        Route::delete('order-items/{orderItem}', [OrderController::class, 'removeItem']);
        Route::post('orders/{order}/submit', [OrderController::class, 'submitToKitchen']);
    });

    // Customer self-service
    Route::
        middleware('role:customer')
        ->group(function () {
        Route::get('/customer/profile', [CustomerController::class, 'profile']);
        Route::get('/customer/orders', [CustomerController::class, 'orders']);
        Route::get('/customer/orders/{order}', [OnlineOrderController::class, 'show']); // Customer can view their own order
        Route::get('/customer/loyalty-points', [CustomerController::class, 'loyaltyPoints']);

        Route::get('/customer/addresses', [OnlineOrderController::class, 'addressesIndex']);
        Route::post('/customer/addresses', [OnlineOrderController::class, 'addressesStore']);

        // Customer online orders (pickup/delivery, requires approval)
        Route::post('/online-orders', [OnlineOrderController::class, 'store']);
    });

    // Customer online orders (pickup/delivery, requires approval)
    Route::post('/online-orders', [OnlineOrderController::class, 'store']);


});

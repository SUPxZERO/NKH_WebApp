<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\MenuItemController;
use App\Http\Controllers\Api\TableController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\OnlineOrderController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\SubCategoryController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\FloorController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\CustomerRequestController;
use App\Http\Controllers\Api\PositionController;
use App\Http\Controllers\Api\LocationController;

// Public endpoints
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{category}', [CategoryController::class, 'show']);

Route::get('/menu-items', [MenuItemController::class, 'index']);
Route::get('/menu-items/{menuItem}', [MenuItemController::class, 'show']);

Route::get('/time-slots', [OnlineOrderController::class, 'timeSlots']);

// New public menu route
Route::get('/menu', [MenuItemController::class, 'index']);

// Public reference data
Route::get('/positions', [PositionController::class, 'index']);
Route::get('/locations', [LocationController::class, 'index']);


// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Admin/Manager management endpoints
    Route::prefix('admin')->middleware('role:admin,manager')->group(function () {
        // Categories
        Route::apiResource('categories', CategoryController::class);
        // Menu Items
        Route::apiResource('menu-items', MenuItemController::class);
        // SubCategories
        Route::apiResource('sub-categories', SubCategoryController::class);
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

        // Order oversight and approvals
        Route::get('orders', [OrderController::class, 'index']); // Assuming an index method for admin
        Route::patch('orders/{order}/approve', [OrderController::class, 'approve']);
        Route::patch('orders/{order}/reject', [OrderController::class, 'reject']);
    });


    // In-store operations for staff (Employee)
    Route::prefix('employee')->middleware('role:admin,manager,waiter')->group(function () {
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
    Route::middleware('role:customer')->group(function () {
        Route::get('/customer/profile', [CustomerController::class, 'profile']);
        Route::get('/customer/orders', [CustomerController::class, 'orders']);
        Route::get('/customer/orders/{order}', [OnlineOrderController::class, 'show']); // Customer can view their own order
        Route::get('/customer/loyalty-points', [CustomerController::class, 'loyaltyPoints']);

        Route::get('/customer/addresses', [OnlineOrderController::class, 'addressesIndex']);
        Route::post('/customer/addresses', [OnlineOrderController::class, 'addressesStore']);

        // Customer online orders (pickup/delivery, requires approval)
        Route::post('/online-orders', [OnlineOrderController::class, 'store']);
    });
});

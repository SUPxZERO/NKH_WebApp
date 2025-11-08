<?php

use App\Http\Controllers\ProfileController;
use App\Models\Customer;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;


// Public route
Route::get('/', fn() => Inertia::render('Customer/Home'))->name('customer.home');

// Customer protected routes
// Note: role middleware expects role slugs (lowercase). Use 'customer' not 'Customer'.
Route::middleware(['auth', 'role:customer'])->group(function () {
        Route::get('/dashboard', fn() => Inertia::render('Customer/Dashboard'))->name('customer.dashboard');
        Route::get('/menu', fn() => Inertia::render('Customer/Menu'))->name('customer.menu');
        Route::get('/cart', fn() => Inertia::render('Customer/Cart'))->name('customer.cart');
        Route::get('/checkout', fn() => Inertia::render('Customer/Checkout'))->name('customer.checkout');
        Route::get('/orders/{order}', fn() => Inertia::render('Customer/OrderDetail'))->name('customer.order.detail');
        Route::get('/track/{orderId}', fn() => Inertia::render('Customer/OrderTracking'))->name('customer.order.track');
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
        Route::get('categories', fn() => Inertia::render('admin/Categories'))->name('admin.categories');
        Route::get('menu-items', fn() => Inertia::render('admin/MenuItems'))->name('admin.menu-items');
        Route::get('categories', fn() => Inertia::render('admin/Categories'))->name('admin.categories');
        Route::get('employees', fn() => Inertia::render('admin/Employees'))->name('admin.employees');
        Route::get('customers', fn() => Inertia::render('admin/Customers'))->name('admin.customers');
        Route::get('expenses', fn() => Inertia::render('admin/Expenses'))->name('admin.expenses');
        Route::get('floors', fn() => Inertia::render('admin/Floors'))->name('admin.floors');
        Route::get('tables', fn() => Inertia::render('admin/Tables'))->name('admin.tables');
        Route::get('invoices', fn() => Inertia::render('admin/Invoices'))->name('admin.invoices');
        Route::get('reservations', fn() => Inertia::render('admin/Reservations'))->name('admin.reservations');
        Route::get('settings', fn() => Inertia::render('admin/Settings'))->name('admin.settings');
        Route::get('customer-requests', [\App\Http\Controllers\Api\CustomerRequestController::class, 'index'])->name('admin.customer-requests');
    });
// Test time slots seeder
Route::middleware('auth')->group(function () {
        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    });


Route::get('/debug-session', function () {
    return response()->json([
        'config' => config('session'),
        'cookie' => request()->cookie(config('session.cookie')),
        'session_id' => session()->getId(),
        'user_id' => Auth::id(),
        'cookies' => request()->cookies->all(),
        'headers' => request()->headers->all(),
    ]);
});

require __DIR__ . '/auth.php';

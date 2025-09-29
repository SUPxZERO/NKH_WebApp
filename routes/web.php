<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Customer routes
Route::get('/', fn () => Inertia::render('app/routes/customer/Home'))->name('customer.home');
Route::get('/dashboard', fn () => Inertia::render('app/routes/customer/Dashboard'))->middleware('auth')->name('customer.dashboard');
Route::get('/menu', fn () => Inertia::render('app/routes/customer/Menu'))->name('customer.menu');
Route::get('/cart', fn () => Inertia::render('app/routes/customer/Cart'))->name('customer.cart');
Route::get('/checkout', fn () => Inertia::render('app/routes/customer/Checkout'))->name('customer.checkout');
Route::get('/orders/{order}', fn () => Inertia::render('app/routes/customer/OrderDetail'))->name('customer.order.detail');
Route::get('/track/{orderId}', fn () => Inertia::render('app/routes/customer/OrderTracking'))->name('customer.order.track');

// Auth routes (if you're not using the default auth scaffolding)
Route::get('/login', fn () => Inertia::render('app/routes/auth/SignIn'))->name('login');
Route::get('/register', fn () => Inertia::render('app/routes/auth/Register'))->name('register');

// Employee routes
Route::prefix('employee')->middleware(['auth', 'role:employee'])->group(function () {
    Route::get('pos', fn () => Inertia::render('app/routes/employee/POS'))->name('employee.pos');
});

// Admin routes
Route::prefix('admin')->middleware(['auth', 'role:admin'])->group(function () {
    Route::get('dashboard', fn () => Inertia::render('app/routes/admin/Dashboard'))->name('admin.dashboard');
    Route::get('categories', fn () => Inertia::render('app/routes/admin/Categories'))->name('admin.categories');
    Route::get('sub-categories', fn () => Inertia::render('app/routes/admin/SubCategories'))->name('admin.sub-categories');
    Route::get('employees', fn () => Inertia::render('app/routes/admin/Employees'))->name('admin.employees');
    Route::get('customers', fn () => Inertia::render('app/routes/admin/Customers'))->name('admin.customers');
    Route::get('expenses', fn () => Inertia::render('app/routes/admin/Expenses'))->name('admin.expenses');
    Route::get('floors', fn () => Inertia::render('app/routes/admin/Floors'))->name('admin.floors');
    Route::get('tables', fn () => Inertia::render('app/routes/admin/Tables'))->name('admin.tables');
    Route::get('invoices', fn () => Inertia::render('app/routes/admin/Invoices'))->name('admin.invoices');
    Route::get('reservations', fn () => Inertia::render('app/routes/admin/Reservations'))->name('admin.reservations');
    Route::get('settings', fn () => Inertia::render('app/routes/admin/Settings'))->name('admin.settings');
    Route::get('customer-requests', fn () => Inertia::render('app/routes/admin/CustomerRequests'))->name('admin.customer-requests');
});


Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

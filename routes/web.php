<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Customer routes
Route::get('/', fn () => Inertia::render('customer/Home'))->name('customer.home');
Route::get('/dashboard', fn () => Inertia::render('customer/Dashboard'))->middleware('auth')->name('customer.dashboard');
Route::get('/menu', fn () => Inertia::render('customer/Menu'))->name('customer.menu');
Route::get('/cart', fn () => Inertia::render('customer/Cart'))->name('customer.cart');
Route::get('/checkout', fn () => Inertia::render('customer/Checkout'))->name('customer.checkout');
Route::get('/orders/{order}', fn () => Inertia::render('customer/OrderDetail'))->name('customer.order.detail');
Route::get('/track/{orderId}', fn () => Inertia::render('customer/OrderTracking'))->name('customer.order.track');

// Auth routes are handled in auth.php
Route::get('/login', fn () => Inertia::render('Auth/SignIn'))->name('login');
Route::get('/register', fn () => Inertia::render('Auth/Register'))->name('register');

// Employee routes
// Route::prefix('employee')->middleware(['auth', 'role:employee'])->group(function () {
//     Route::get('pos', fn () => Inertia::render('Employee/POS'))->name('employee.pos');
// });

// Admin routes
// Route::prefix('admin')->middleware(['auth', 'role:admin'])->group(function () {
//     Route::get('dashboard', fn () => Inertia::render('Admin/Dashboard'))->name('admin.dashboard');
//     Route::get('categories', fn () => Inertia::render('Admin/Categories'))->name('admin.categories');
//     Route::get('sub-categories', fn () => Inertia::render('Admin/SubCategories'))->name('admin.sub-categories');
//     Route::get('employees', fn () => Inertia::render('Admin/Employees'))->name('admin.employees');
//     Route::get('customers', fn () => Inertia::render('Admin/Customers'))->name('admin.customers');
//     Route::get('expenses', fn () => Inertia::render('Admin/Expenses'))->name('admin.expenses');
//     Route::get('floors', fn () => Inertia::render('Admin/Floors'))->name('admin.floors');
//     Route::get('tables', fn () => Inertia::render('Admin/Tables'))->name('admin.tables');
//     Route::get('invoices', fn () => Inertia::render('Admin/Invoices'))->name('admin.invoices');
//     Route::get('reservations', fn () => Inertia::render('Admin/Reservations'))->name('admin.reservations');
//     Route::get('settings', fn () => Inertia::render('Admin/Settings'))->name('admin.settings');
//     Route::get('customer-requests', fn () => Inertia::render('Admin/CustomerRequests'))->name('admin.customer-requests');
// });

Route::prefix('admin')->group(function () {
    Route::get('dashboard', fn () => Inertia::render('admin/Dashboard'))->name('admin.dashboard');
    Route::get('categories', fn () => Inertia::render('admin/Categories'))->name('admin.categories');
    Route::get('sub-categories', fn () => Inertia::render('admin/SubCategories'))->name('admin.sub-categories');
    Route::get('employees', fn () => Inertia::render('admin/Employees'))->name('admin.employees');
    Route::get('customers', fn () => Inertia::render('admin/Customers'))->name('admin.customers');
    Route::get('expenses', fn () => Inertia::render('admin/Expenses'))->name('admin.expenses');
    Route::get('floors', fn () => Inertia::render('admin/Floors'))->name('admin.floors');
    Route::get('tables', fn () => Inertia::render('admin/Tables'))->name('admin.tables');
    Route::get('invoices', fn () => Inertia::render('admin/Invoices'))->name('admin.invoices');
    Route::get('reservations', fn () => Inertia::render('admin/Reservations'))->name('admin.reservations');
    Route::get('settings', fn () => Inertia::render('admin/Settings'))->name('admin.settings');
    Route::get('customer-requests', fn () => Inertia::render('admin/CustomerRequests'))->name('admin.customer-requests');
});

Route::prefix('employee')->group(function () {
    Route::get('pos', fn () => Inertia::render('employee/POS'))->name('employee.pos');
});




Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

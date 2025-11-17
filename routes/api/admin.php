<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\DashboardController;

Route::
    // middleware(['auth', 'role:admin'])->
    prefix('admin')
    ->group(function () {
    Route::get('/dashboard/analytics', [DashboardController::class, 'analytics']);
    Route::get('/dashboard/orders/stats', [DashboardController::class, 'orderStats']);
    Route::get('/dashboard/revenue/{period}', [DashboardController::class, 'revenue'])->where('period', 'daily|weekly|monthly');
});
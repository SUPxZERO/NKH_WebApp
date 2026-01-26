<?php

namespace App\Providers;

use App\Models\OrderItem;
use App\Models\OperatingHours;
use App\Models\CustomerAddress;
use App\Observers\OrderItemObserver;
use App\Observers\OperatingHoursObserver;
use App\Observers\CustomerAddressObserver;
use App\Observers\GlobalAuditObserver;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Event;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Cache\RateLimiting\Limit;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        JsonResource::wrap('data');

        // ============================================
        // AUDIT LOGGING SYSTEM - COMPLETE REGISTRATION
        // ============================================
        // Register GlobalAuditObserver on ALL auditable models
        // This ensures every CRUD action is tracked in audit_logs
        $this->registerAuditObservers();

        // Register auth event subscriber for login/logout tracking
        Event::subscribe(\App\Listeners\AuthEventSubscriber::class);

        // Register model-specific observers (for specialized behavior) s
        OrderItem::observe(OrderItemObserver::class);
        OperatingHours::observe(OperatingHoursObserver::class);
        CustomerAddress::observe(CustomerAddressObserver::class);

        // Log slow queries for debugging (development only)
        if (app()->environment(['local', 'development'])) {
            DB::listen(function ($query) {
                $ms = $query->time ?? 0;
                if ($ms > 200) {
                    Log::warning('Slow query detected', [
                        'sql' => $query->sql,
                        'bindings' => $query->bindings,
                        'time_ms' => $ms,
                    ]);
                }
            });
        }
        // Rate Limiter for sensitive actions
        RateLimiter::for('sensitive', function (\Illuminate\Http\Request $request) {
            return Limit::perMinute(5)->by($request->user()?->id ?: $request->ip());
        });
    }

    /**
     * Register GlobalAuditObserver on all auditable models
     * 
     * IMPORTANT: Models are listed explicitly because Laravel does not support
     * Model::observe() on the abstract Model class.
     */
    private function registerAuditObservers(): void
    {
        $auditableModels = [
            // Core User & Auth
            \App\Models\User::class,
            \App\Models\Customer::class,
            \App\Models\Employee::class,
            \App\Models\Role::class,
            \App\Models\Permission::class,

            // Orders & Payments
            \App\Models\Order::class,
            OrderItem::class,
            \App\Models\Payment::class,
            \App\Models\Refund::class,
            \App\Models\Invoice::class,

            // Menu & Inventory
            \App\Models\MenuItem::class,
            \App\Models\Category::class,
            \App\Models\Recipe::class,
            \App\Models\RecipeIngredient::class,
            \App\Models\Ingredient::class,
            \App\Models\Inventory::class,
            \App\Models\InventoryTransaction::class,
            \App\Models\InventoryAdjustment::class,
            \App\Models\Unit::class,
            \App\Models\Promotion::class,

            // Restaurant Operations
            \App\Models\Reservation::class,
            \App\Models\DiningTable::class,
            \App\Models\TableSession::class,
            \App\Models\Floor::class,
            \App\Models\Location::class,
            OperatingHours::class,

                // Customer Data
            CustomerAddress::class,
            \App\Models\CustomerPreference::class,
            \App\Models\CustomerLoginHistory::class,
            \App\Models\CustomerCommunicationLog::class,
            \App\Models\LoyaltyPoint::class,
            \App\Models\Feedback::class,

            // Employee & HR
            \App\Models\Shift::class,
            \App\Models\ShiftSwap::class,
            \App\Models\Attendance::class,
            \App\Models\Payroll::class,
            \App\Models\Position::class,
            \App\Models\TimeOffRequest::class,
            \App\Models\EmploymentHistory::class,
            \App\Models\EmployeeAchievement::class,

            // Procurement
            \App\Models\Supplier::class,
            \App\Models\PurchaseOrder::class,
            \App\Models\PurchaseOrderItem::class,
            \App\Models\StockAlert::class,

            // Finance
            \App\Models\Expense::class,
            \App\Models\ExpenseCategory::class,
            \App\Models\PaymentMethod::class,

            // Notifications & Communications
            \App\Models\BroadcastNotification::class,
            \App\Models\UserNotification::class,
            \App\Models\TelegramOrderNotification::class,
            \App\Models\TelegramUser::class,

            // Settings & System
            \App\Models\Setting::class,
            \App\Models\UserProfile::class,

            // Translations
            \App\Models\CategoryTranslation::class,
            \App\Models\MenuItemTranslation::class,
        ];

        foreach ($auditableModels as $model) {
            if (class_exists($model)) {
                $model::observe(GlobalAuditObserver::class);
            }
        }
    }
}

<?php

namespace App\Providers;

use App\Models\OrderItem;
use App\Observers\OrderItemObserver;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\ServiceProvider;

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

        // Register model observers
        OrderItem::observe(OrderItemObserver::class);

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
    }
}

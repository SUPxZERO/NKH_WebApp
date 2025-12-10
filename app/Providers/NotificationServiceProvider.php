<?php

namespace App\Providers;

use App\Services\NotificationService;
use Illuminate\Support\ServiceProvider;

class NotificationServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(NotificationService::class, function ($app) {
            return new NotificationService();
        });

        // Alias for convenience
        $this->app->alias(NotificationService::class, 'notifications');
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}

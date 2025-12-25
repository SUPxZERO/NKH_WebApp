<?php

namespace App\Providers;

use App\Services\Telegram\TelegramBotService;
use App\Services\Telegram\TelegramCartSessionManager;
use App\Services\Telegram\TelegramKeyboardBuilder;
use App\Services\Telegram\TelegramOrderNotificationService;
use Illuminate\Support\ServiceProvider;

class TelegramServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Register TelegramBotService as singleton
        $this->app->singleton(TelegramBotService::class, function ($app) {
            return new TelegramBotService();
        });

        // Register TelegramKeyboardBuilder as singleton
        $this->app->singleton(TelegramKeyboardBuilder::class, function ($app) {
            return new TelegramKeyboardBuilder();
        });

        // Register TelegramOrderNotificationService as singleton
        $this->app->singleton(TelegramOrderNotificationService::class, function ($app) {
            return new TelegramOrderNotificationService(
                $app->make(TelegramBotService::class),
                $app->make(TelegramKeyboardBuilder::class)
            );
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Load Telegram config if not already loaded
        $configPath = config_path('telegram.php');
        if (file_exists($configPath) && !config('telegram')) {
            $this->loadMigrationsFrom(database_path('migrations/2025_12_25_000001_create_telegram_users_table.php'));
        }
    }
}

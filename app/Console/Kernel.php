<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
        Commands\SeedDatabase::class,
        Commands\InsertHoldOrderUI::class,
    ];

    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Generate time slots for the next 7 days every day at midnight
        $schedule->command('timeslots:generate 7')
            ->daily()
            ->at('00:01')
            ->appendOutputTo(storage_path('logs/timeslots.log'));
        
        // Sprint 1: Clean up expired sessions daily
        $schedule->command('sessions:cleanup --hours=24')
            ->daily()
            ->at('02:00')
            ->withoutOverlapping();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}

<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Jobs\ExpirePaymentsJob;
use App\Jobs\DailyReconciliationJob;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Payment scheduled tasks
Schedule::job(new ExpirePaymentsJob())->everyMinute();
Schedule::job(new DailyReconciliationJob())->dailyAt(config('payment.settlement.time', '23:59'));

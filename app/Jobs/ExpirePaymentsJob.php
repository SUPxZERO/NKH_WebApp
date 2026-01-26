<?php

namespace App\Jobs;

use App\Models\Payment;
use App\Models\PaymentAuditLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ExpirePaymentsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        $this->onQueue('payments');
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $expiredPayments = Payment::expired()->get();

        $count = 0;

        foreach ($expiredPayments as $payment) {
            // markAsFailed handles status update, failure reason, and audit logging
            $payment->markAsFailed('Payment expired');
            $count++;
        }

        if ($count > 0) {
            Log::info('Expired pending payments', ['count' => $count]);
        }
    }
}

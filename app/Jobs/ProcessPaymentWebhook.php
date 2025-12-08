<?php

namespace App\Jobs;

use App\Models\Payment;
use App\Models\PaymentAuditLog;
use App\Services\InvoiceService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessPaymentWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;
    public int $timeout = 60;

    protected array $webhookData;
    protected int $paymentId;

    /**
     * Create a new job instance.
     */
    public function __construct(int $paymentId, array $webhookData)
    {
        $this->paymentId = $paymentId;
        $this->webhookData = $webhookData;
        $this->onQueue('payments');
    }

    /**
     * Execute the job.
     */
    public function handle(InvoiceService $invoiceService): void
    {
        Log::info('Processing payment webhook job', [
            'payment_id' => $this->paymentId,
            'attempt' => $this->attempts(),
        ]);

        DB::transaction(function () use ($invoiceService) {
            $payment = Payment::where('id', $this->paymentId)
                ->lockForUpdate()
                ->first();

            if (!$payment) {
                Log::error('Payment not found in webhook job', [
                    'payment_id' => $this->paymentId,
                ]);
                return;
            }

            // Skip if already processed
            if (!$payment->isPending()) {
                Log::info('Payment already processed, skipping', [
                    'payment_id' => $payment->id,
                    'status' => $payment->status,
                ]);
                return;
            }

            $oldStatus = $payment->status;
            $success = in_array($this->webhookData['status'] ?? '', ['success', 'completed']);

            if ($success) {
                $payment->update([
                    'status' => Payment::STATUS_COMPLETED,
                    'processed_at' => now(),
                    'gateway_reference' => $this->webhookData['gateway_reference'] ?? null,
                ]);

                // Update invoice
                $invoice = $payment->invoice()->lockForUpdate()->first();
                if ($invoice) {
                    $invoice->loadMissing('payments', 'order');
                    $invoiceService->reconcileStatus($invoice);
                }
            } else {
                $reason = $this->webhookData['failure_reason'] 
                    ?? $this->webhookData['message'] 
                    ?? 'Payment failed';
                
                $payment->update([
                    'status' => Payment::STATUS_FAILED,
                    'failure_reason' => $reason,
                    'retry_count' => $payment->retry_count + 1,
                ]);
            }

            // Log the processing
            PaymentAuditLog::logWebhook(
                $payment,
                'webhook_job_processed',
                $oldStatus,
                $payment->status,
                $this->webhookData
            );
        });
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Payment webhook job failed', [
            'payment_id' => $this->paymentId,
            'error' => $exception->getMessage(),
        ]);

        // Mark payment as needing manual review
        $payment = Payment::find($this->paymentId);
        if ($payment && $payment->isPending()) {
            $payment->update([
                'status' => Payment::STATUS_FAILED,
                'failure_reason' => 'Webhook processing failed after ' . $this->tries . ' attempts',
            ]);
        }
    }
}

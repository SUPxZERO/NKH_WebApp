<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\PaymentAuditLog;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class PaymentMonitoringService
{
    /**
     * Log a payment event.
     */
    public function logEvent(
        Payment $payment,
        string $event,
        array $context = [],
        string $level = 'info'
    ): void {
        $logContext = array_merge([
            'payment_id' => $payment->id,
            'payment_uuid' => $payment->uuid,
            'reference' => $payment->reference_number,
            'amount' => $payment->amount,
            'currency' => $payment->currency,
            'status' => $payment->status,
            'method' => $payment->paymentMethod?->code,
        ], $context);

        // Log to dedicated payment channel
        Log::channel('payment')->{$level}("[Payment] {$event}", $logContext);

        // Also log to default channel for aggregation
        Log::log($level, "[Payment] {$event}", $logContext);

        // Track metrics
        $this->trackMetric($event, $payment);
    }

    /**
     * Track payment metric for monitoring.
     */
    public function trackMetric(string $event, Payment $payment): void
    {
        $key = "payment_metrics:" . now()->format('Y-m-d:H');
        
        // Increment event counter
        Cache::increment("{$key}:{$event}", 1);
        
        // Track by payment method
        if ($payment->paymentMethod) {
            Cache::increment("{$key}:method:{$payment->paymentMethod->code}", 1);
        }
        
        // Track failures specifically
        if ($event === 'payment_failed') {
            Cache::increment("{$key}:failures", 1);
            $this->checkFailureThreshold();
        }
    }

    /**
     * Check if failure rate exceeds threshold and alert if necessary.
     */
    protected function checkFailureThreshold(): void
    {
        $key = "payment_metrics:" . now()->format('Y-m-d:H');
        
        $total = (int) Cache::get("{$key}:payment_initiated", 0);
        $failures = (int) Cache::get("{$key}:failures", 0);
        
        if ($total < 10) {
            // Not enough data to determine threshold
            return;
        }

        $failureRate = ($failures / $total) * 100;
        $threshold = config('payment.monitoring.failure_threshold', 10); // 10%

        if ($failureRate >= $threshold) {
            $alertKey = "payment_alert:high_failure:{$key}";
            
            // Only alert once per hour
            if (!Cache::has($alertKey)) {
                Cache::put($alertKey, true, now()->addHour());
                $this->sendHighFailureAlert($failureRate, $failures, $total);
            }
        }
    }

    /**
     * Send alert for high failure rate.
     */
    protected function sendHighFailureAlert(float $rate, int $failures, int $total): void
    {
        Log::channel('payment')->critical('High payment failure rate detected', [
            'failure_rate' => round($rate, 2) . '%',
            'failures' => $failures,
            'total' => $total,
            'hour' => now()->format('Y-m-d H:00'),
        ]);

        // Could also send email/Slack notification here
        // Notification::send(...);
    }

    /**
     * Get payment metrics for the last N hours.
     */
    public function getMetrics(int $hours = 24): array
    {
        $metrics = [];
        
        for ($i = 0; $i < $hours; $i++) {
            $time = now()->subHours($i);
            $key = "payment_metrics:" . $time->format('Y-m-d:H');
            
            $metrics[] = [
                'hour' => $time->format('Y-m-d H:00'),
                'initiated' => (int) Cache::get("{$key}:payment_initiated", 0),
                'completed' => (int) Cache::get("{$key}:payment_completed", 0),
                'failed' => (int) Cache::get("{$key}:failures", 0),
                'qr' => (int) Cache::get("{$key}:method:qr", 0),
                'cash' => (int) Cache::get("{$key}:method:cash", 0),
                'card' => (int) Cache::get("{$key}:method:card", 0),
            ];
        }

        return array_reverse($metrics);
    }

    /**
     * Get current health status.
     */
    public function getHealthStatus(): array
    {
        $key = "payment_metrics:" . now()->format('Y-m-d:H');
        
        $initiated = (int) Cache::get("{$key}:payment_initiated", 0);
        $completed = (int) Cache::get("{$key}:payment_completed", 0);
        $failures = (int) Cache::get("{$key}:failures", 0);
        
        $successRate = $initiated > 0 
            ? (($initiated - $failures) / $initiated) * 100 
            : 100;
        
        $status = 'healthy';
        if ($successRate < 90) $status = 'degraded';
        if ($successRate < 70) $status = 'critical';

        return [
            'status' => $status,
            'success_rate' => round($successRate, 2),
            'current_hour' => [
                'initiated' => $initiated,
                'completed' => $completed,
                'failed' => $failures,
            ],
            'checked_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Verify payment integrity (for reconciliation).
     */
    public function verifyPaymentIntegrity(Payment $payment): array
    {
        $issues = [];

        // Check if payment has valid invoice
        if ($payment->invoice_id && !$payment->invoice) {
            $issues[] = 'Invalid invoice reference';
        }

        // Check if completed payment has transaction ID
        if ($payment->isCompleted() && !$payment->transaction_id) {
            $issues[] = 'Missing transaction ID for completed payment';
        }

        // Check for orphaned completed payments (no audit log)
        if ($payment->isCompleted()) {
            $hasCompletionLog = PaymentAuditLog::where('payment_id', $payment->id)
                ->where('action', 'payment_completed')
                ->exists();
            
            if (!$hasCompletionLog) {
                $issues[] = 'Missing completion audit log';
            }
        }

        // Check for suspiciously fast completions
        if ($payment->isCompleted() && $payment->completed_at) {
            $seconds = $payment->created_at->diffInSeconds($payment->completed_at);
            if ($seconds < 1) {
                $issues[] = 'Suspiciously fast completion';
            }
        }

        return [
            'payment_id' => $payment->id,
            'is_valid' => empty($issues),
            'issues' => $issues,
        ];
    }
}

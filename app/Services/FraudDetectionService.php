<?php

namespace App\Services;

use App\Models\Payment;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class FraudDetectionService
{
    /**
     * Check payment for potential fraud.
     * Returns array with 'passed' boolean and 'reasons' array.
     */
    public function checkPayment(Payment $payment, array $context = []): array
    {
        $reasons = [];
        $score = 0;

        // Run all fraud checks
        $checks = [
            $this->checkVelocity($payment, $context),
            $this->checkHighValue($payment),
            $this->checkFailedAttempts($payment, $context),
            $this->checkDeviceFingerprint($payment, $context),
            $this->checkGeolocation($context),
        ];

        foreach ($checks as $check) {
            $score += $check['score'];
            if (!empty($check['reason'])) {
                $reasons[] = $check['reason'];
            }
        }

        $threshold = config('payment.fraud.score_threshold', 50);
        $passed = $score < $threshold;

        if (!$passed) {
            Log::warning('Payment failed fraud check', [
                'payment_id' => $payment->id,
                'score' => $score,
                'threshold' => $threshold,
                'reasons' => $reasons,
            ]);
        }

        return [
            'passed' => $passed,
            'score' => $score,
            'threshold' => $threshold,
            'reasons' => $reasons,
        ];
    }

    /**
     * Check velocity - too many orders in short time.
     */
    protected function checkVelocity(Payment $payment, array $context): array
    {
        $customerId = $payment->invoice?->order?->customer_id;
        if (!$customerId) {
            return ['score' => 0, 'reason' => null];
        }

        $limit = config('payment.fraud.velocity_limit', 5);
        $window = 10; // 10 minutes

        $key = "payment_velocity:{$customerId}";
        $count = Cache::get($key, 0);

        // Increment counter
        Cache::put($key, $count + 1, $window * 60);

        if ($count >= $limit) {
            return [
                'score' => 30,
                'reason' => "Velocity limit exceeded: {$count} payments in {$window} minutes",
            ];
        }

        return ['score' => 0, 'reason' => null];
    }

    /**
     * Check for high-value transactions.
     */
    protected function checkHighValue(Payment $payment): array
    {
        $threshold = config('payment.fraud.high_value_threshold', 500);
        $amount = (float) $payment->amount;

        if ($amount >= $threshold) {
            return [
                'score' => 20,
                'reason' => "High value transaction: {$payment->currency} {$amount}",
            ];
        }

        return ['score' => 0, 'reason' => null];
    }

    /**
     * Check for repeated failed attempts.
     */
    protected function checkFailedAttempts(Payment $payment, array $context): array
    {
        $ip = $context['ip'] ?? request()->ip();
        $key = "payment_failed:{$ip}";
        
        $failedCount = Cache::get($key, 0);
        $maxFailed = config('payment.fraud.max_failed_attempts', 3);

        if ($failedCount >= $maxFailed) {
            return [
                'score' => 40,
                'reason' => "Too many failed attempts from IP: {$failedCount}",
            ];
        }

        return ['score' => 0, 'reason' => null];
    }

    /**
     * Check device fingerprint for anomalies.
     */
    protected function checkDeviceFingerprint(Payment $payment, array $context): array
    {
        $fingerprint = $payment->device_fingerprint ?? $context['fingerprint'] ?? null;
        
        if (!$fingerprint) {
            // No fingerprint - slight risk
            return ['score' => 5, 'reason' => 'No device fingerprint provided'];
        }

        // Check if fingerprint is associated with fraud
        $blacklisted = Cache::get("fraud_fingerprint:{$fingerprint}", false);
        if ($blacklisted) {
            return [
                'score' => 100,
                'reason' => 'Device fingerprint is blacklisted',
            ];
        }

        return ['score' => 0, 'reason' => null];
    }

    /**
     * Check geolocation for suspicious patterns.
     */
    protected function checkGeolocation(array $context): array
    {
        $ip = $context['ip'] ?? request()->ip();
        
        // Skip for localhost
        if (in_array($ip, ['127.0.0.1', '::1', 'localhost'])) {
            return ['score' => 0, 'reason' => null];
        }

        // In production, integrate with IP geolocation service
        // For now, we'll just check for known VPN/proxy ranges
        
        return ['score' => 0, 'reason' => null];
    }

    /**
     * Record a failed payment attempt.
     */
    public function recordFailedAttempt(string $ip): void
    {
        $key = "payment_failed:{$ip}";
        $count = Cache::get($key, 0);
        $blockDuration = config('payment.fraud.block_duration', 30) * 60;
        
        Cache::put($key, $count + 1, $blockDuration);
    }

    /**
     * Check if an IP is currently blocked.
     */
    public function isBlocked(string $ip): bool
    {
        $key = "payment_failed:{$ip}";
        $failedCount = Cache::get($key, 0);
        $maxFailed = config('payment.fraud.max_failed_attempts', 3);

        return $failedCount >= $maxFailed;
    }

    /**
     * Blacklist a device fingerprint.
     */
    public function blacklistFingerprint(string $fingerprint, string $reason = ''): void
    {
        Cache::put("fraud_fingerprint:{$fingerprint}", true, 86400 * 30); // 30 days
        
        Log::info('Device fingerprint blacklisted', [
            'fingerprint' => substr($fingerprint, 0, 20) . '...',
            'reason' => $reason,
        ]);
    }
}

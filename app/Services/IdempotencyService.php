<?php

namespace App\Services;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class IdempotencyService
{
    /**
     * Generate an idempotency key from request context.
     */
    public function generateKey(Request $request): string
    {
        // Check if client provided an idempotency key
        $clientKey = $request->header('Idempotency-Key') 
            ?? $request->input('idempotency_key');
        
        if ($clientKey) {
            return $this->normalizeKey($clientKey);
        }

        // Generate key from request signature
        $components = [
            $request->user()?->id ?? 'guest',
            $request->method(),
            $request->path(),
            md5(json_encode($request->except(['_token', 'timestamp']))),
        ];

        return hash('sha256', implode(':', $components));
    }

    /**
     * Normalize and validate an idempotency key.
     */
    public function normalizeKey(string $key): string
    {
        // Remove any unsafe characters
        $key = preg_replace('/[^a-zA-Z0-9_\-]/', '', $key);
        
        // Ensure max length
        if (strlen($key) > 64) {
            $key = substr($key, 0, 64);
        }
        
        // Ensure minimum length
        if (strlen($key) < 8) {
            throw new \InvalidArgumentException('Idempotency key must be at least 8 characters');
        }

        return $key;
    }

    /**
     * Check if a payment with this idempotency key already exists.
     */
    public function checkExistingPayment(string $idempotencyKey): ?Payment
    {
        return Payment::where('idempotency_key', $idempotencyKey)->first();
    }

    /**
     * Lock an idempotency key to prevent race conditions.
     * 
     * @return bool True if lock acquired, false if key is already locked
     */
    public function acquireLock(string $idempotencyKey, int $ttlSeconds = 30): bool
    {
        $lockKey = "idempotency_lock:{$idempotencyKey}";
        
        return Cache::add($lockKey, true, $ttlSeconds);
    }

    /**
     * Release an idempotency lock.
     */
    public function releaseLock(string $idempotencyKey): void
    {
        $lockKey = "idempotency_lock:{$idempotencyKey}";
        Cache::forget($lockKey);
    }

    /**
     * Process a payment with idempotency protection.
     * 
     * @param string $idempotencyKey
     * @param callable $callback Function that creates/processes the payment
     * @return array ['payment' => Payment|null, 'is_replay' => bool, 'error' => string|null]
     */
    public function processWithIdempotency(string $idempotencyKey, callable $callback): array
    {
        // Check for existing payment
        $existingPayment = $this->checkExistingPayment($idempotencyKey);
        
        if ($existingPayment) {
            return [
                'payment' => $existingPayment,
                'is_replay' => true,
                'error' => null,
            ];
        }

        // Try to acquire lock
        if (!$this->acquireLock($idempotencyKey)) {
            return [
                'payment' => null,
                'is_replay' => false,
                'error' => 'Request is already being processed',
            ];
        }

        try {
            // Double-check for existing payment (race condition protection)
            $existingPayment = $this->checkExistingPayment($idempotencyKey);
            
            if ($existingPayment) {
                return [
                    'payment' => $existingPayment,
                    'is_replay' => true,
                    'error' => null,
                ];
            }

            // Execute the callback
            $payment = $callback($idempotencyKey);
            
            return [
                'payment' => $payment,
                'is_replay' => false,
                'error' => null,
            ];

        } finally {
            $this->releaseLock($idempotencyKey);
        }
    }

    /**
     * Generate a client-side idempotency key for frontend use.
     */
    public function generateClientKey(): string
    {
        return Str::uuid()->toString();
    }

    /**
     * Validate idempotency key format.
     */
    public function isValidKey(?string $key): bool
    {
        if (!$key) return false;
        
        // Check length
        if (strlen($key) < 8 || strlen($key) > 64) {
            return false;
        }
        
        // Check for valid characters
        return (bool) preg_match('/^[a-zA-Z0-9_\-]+$/', $key);
    }
}

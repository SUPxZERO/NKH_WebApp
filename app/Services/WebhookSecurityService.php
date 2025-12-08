<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class WebhookSecurityService
{
    /**
     * Verify webhook request security.
     */
    public function verify(Request $request): array
    {
        $errors = [];

        // 1. IP Whitelist check
        if (!$this->verifyIpWhitelist($request)) {
            $errors[] = 'IP address not whitelisted';
        }

        // 2. Signature verification
        $signatureResult = $this->verifySignature($request);
        if (!$signatureResult['valid']) {
            $errors[] = $signatureResult['error'];
        }

        // 3. Timestamp validation
        if (!$this->verifyTimestamp($request)) {
            $errors[] = 'Request timestamp expired or invalid';
        }

        // 4. Nonce/Replay protection
        if (!$this->verifyNonce($request)) {
            $errors[] = 'Duplicate request detected (replay attack)';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    /**
     * Check if request IP is whitelisted.
     */
    public function verifyIpWhitelist(Request $request): bool
    {
        $allowedIps = config('payment.webhook_allowed_ips', []);
        
        // If no whitelist configured, allow all (for development)
        if (empty($allowedIps)) {
            return true;
        }

        $clientIp = $request->ip();

        // Check direct match
        if (in_array($clientIp, $allowedIps)) {
            return true;
        }

        // Check CIDR ranges
        foreach ($allowedIps as $allowed) {
            if (str_contains($allowed, '/') && $this->ipInCidr($clientIp, $allowed)) {
                return true;
            }
        }

        Log::warning('Webhook from non-whitelisted IP', [
            'ip' => $clientIp,
            'allowed' => $allowedIps,
        ]);

        return false;
    }

    /**
     * Verify HMAC signature.
     */
    public function verifySignature(Request $request): array
    {
        $secret = config('payment.webhook_secret');
        
        // If no secret configured, skip verification (for development)
        if (empty($secret)) {
            return ['valid' => true, 'error' => null];
        }

        $signature = $request->header('X-Payment-Signature') 
            ?? $request->header('X-Webhook-Signature');

        if (!$signature) {
            return ['valid' => false, 'error' => 'Missing signature header'];
        }

        // Build canonical payload for signature
        $timestamp = $request->input('timestamp', '');
        $payload = $this->buildCanonicalPayload($request);
        
        // Generate expected signature
        $expectedSignature = hash_hmac('sha256', $payload, $secret);

        // Time-safe comparison
        if (!hash_equals($expectedSignature, $signature)) {
            Log::warning('Webhook signature mismatch', [
                'received' => substr($signature, 0, 20) . '...',
            ]);
            return ['valid' => false, 'error' => 'Invalid signature'];
        }

        return ['valid' => true, 'error' => null];
    }

    /**
     * Verify timestamp is within acceptable window.
     */
    public function verifyTimestamp(Request $request): bool
    {
        $timestamp = $request->input('timestamp');
        
        if (!$timestamp) {
            // Timestamp not provided - allow for backwards compatibility
            return true;
        }

        $windowSeconds = 300; // 5 minutes
        $currentTime = time();
        $requestTime = (int) $timestamp;

        $diff = abs($currentTime - $requestTime);

        if ($diff > $windowSeconds) {
            Log::warning('Webhook timestamp outside window', [
                'request_time' => $requestTime,
                'current_time' => $currentTime,
                'diff_seconds' => $diff,
            ]);
            return false;
        }

        return true;
    }

    /**
     * Verify nonce to prevent replay attacks.
     */
    public function verifyNonce(Request $request): bool
    {
        $nonce = $request->header('X-Payment-Nonce') 
            ?? $request->input('nonce')
            ?? $request->input('idempotency_key');

        if (!$nonce) {
            // No nonce provided - allow but log
            return true;
        }

        $cacheKey = "webhook_nonce:{$nonce}";
        
        // Check if nonce was already used
        if (Cache::has($cacheKey)) {
            Log::warning('Duplicate webhook nonce detected', [
                'nonce' => $nonce,
            ]);
            return false;
        }

        // Store nonce for 1 hour
        Cache::put($cacheKey, true, 3600);

        return true;
    }

    /**
     * Build canonical payload string for signature verification.
     */
    protected function buildCanonicalPayload(Request $request): string
    {
        // Standard fields to include in signature
        $fields = [
            'transaction_id' => $request->input('transaction_id', ''),
            'qr_reference' => $request->input('qr_reference', ''),
            'amount' => $request->input('amount', ''),
            'status' => $request->input('status', ''),
            'timestamp' => $request->input('timestamp', ''),
        ];

        // Sort by key and join
        ksort($fields);
        
        return implode('|', array_filter($fields, fn($v) => $v !== ''));
    }

    /**
     * Check if IP is within CIDR range.
     */
    protected function ipInCidr(string $ip, string $cidr): bool
    {
        [$subnet, $mask] = explode('/', $cidr);
        $mask = (int) $mask;
        
        $ip = ip2long($ip);
        $subnet = ip2long($subnet);
        $mask = -1 << (32 - $mask);
        
        $subnet &= $mask;
        
        return ($ip & $mask) === $subnet;
    }

    /**
     * Generate a signature for outgoing webhooks (if needed).
     */
    public function generateSignature(array $payload): string
    {
        $secret = config('payment.webhook_secret');
        
        ksort($payload);
        $canonicalPayload = implode('|', array_filter($payload, fn($v) => $v !== ''));
        
        return hash_hmac('sha256', $canonicalPayload, $secret);
    }
}

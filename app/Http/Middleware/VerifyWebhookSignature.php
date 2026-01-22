<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class VerifyWebhookSignature
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $provider  The payment provider (stripe, bakong, etc.)
     */
    public function handle(Request $request, Closure $next, string $provider = 'generic'): Response
    {
        // SECURITY: Webhook verification is now enforced in ALL environments by default
        // To disable in local dev, set PAYMENT_ENFORCE_WEBHOOK_VERIFICATION=false in .env
        if (app()->environment('local') && !config('payment.security.enforce_webhook_verification', true)) {
            Log::info('Webhook verification skipped in local environment (PAYMENT_ENFORCE_WEBHOOK_VERIFICATION=false)');
            return $next($request);
        }

        $verified = match ($provider) {
            'stripe' => $this->verifyStripe($request),
            'bakong' => $this->verifyBakong($request),
            'generic' => $this->verifyGeneric($request),
            default => false,
        };

        if (!$verified) {
            Log::warning('Webhook signature verification failed', [
                'provider' => $provider,
                'ip' => $request->ip(),
                'url' => $request->fullUrl(),
            ]);

            return response()->json([
                'error' => 'Invalid webhook signature',
            ], 403);
        }

        return $next($request);
    }

    /**
     * Verify Stripe webhook signature.
     */
    protected function verifyStripe(Request $request): bool
    {
        $secret = config('services.stripe.webhook_secret');

        if (!$secret) {
            // No secret configured, skip verification (but log warning)
            Log::warning('Stripe webhook secret not configured');
            return true;
        }

        $signature = $request->header('Stripe-Signature');

        if (!$signature) {
            return false;
        }

        try {
            // Parse the signature header
            $parts = [];
            foreach (explode(',', $signature) as $part) {
                $pair = explode('=', $part, 2);
                if (count($pair) === 2) {
                    $parts[$pair[0]] = $pair[1];
                }
            }

            if (!isset($parts['t']) || !isset($parts['v1'])) {
                return false;
            }

            $timestamp = $parts['t'];
            $expectedSignature = $parts['v1'];

            // Verify timestamp tolerance (5 minutes)
            if (abs(time() - (int) $timestamp) > 300) {
                Log::warning('Stripe webhook timestamp too old', [
                    'timestamp' => $timestamp,
                    'current' => time(),
                ]);
                return false;
            }

            // Compute expected signature
            $payload = $timestamp . '.' . $request->getContent();
            $computedSignature = hash_hmac('sha256', $payload, $secret);

            return hash_equals($computedSignature, $expectedSignature);

        } catch (\Exception $e) {
            Log::error('Stripe signature verification error', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Verify Bakong webhook signature.
     */
    protected function verifyBakong(Request $request): bool
    {
        $secret = config('payment.webhook_secret');

        if (!$secret) {
            return true;
        }

        $signature = $request->header('X-Bakong-Signature');

        if (!$signature) {
            return false;
        }

        // Compute HMAC-SHA256
        $payload = $request->getContent();
        $computedSignature = hash_hmac('sha256', $payload, $secret);

        return hash_equals($computedSignature, $signature);
    }

    /**
     * Verify generic webhook using shared secret.
     */
    protected function verifyGeneric(Request $request): bool
    {
        $secret = config('payment.webhook_secret');

        if (!$secret) {
            return true;
        }

        // Check for signature in common header locations
        $signature = $request->header('X-Webhook-Signature')
            ?? $request->header('X-Signature')
            ?? $request->header('X-Hub-Signature-256')
            ?? $request->input('signature');

        if (!$signature) {
            return false;
        }

        // Remove algorithm prefix if present (sha256=...)
        if (str_contains($signature, '=')) {
            $signature = explode('=', $signature, 2)[1] ?? $signature;
        }

        $payload = $request->getContent();
        $computedSignature = hash_hmac('sha256', $payload, $secret);

        return hash_equals($computedSignature, $signature);
    }
}

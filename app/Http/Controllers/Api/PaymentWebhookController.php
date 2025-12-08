<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\PaymentAuditLog;
use App\Services\InvoiceService;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    protected PaymentService $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    /**
     * Handle payment webhook callback from payment gateway.
     * 
     * POST /api/webhooks/payment
     * 
     * Expected payload:
     * {
     *   "transaction_id": "string",
     *   "qr_reference": "string",
     *   "status": "success|failed|pending",
     *   "amount": "number",
     *   "currency": "USD|KHR",
     *   "gateway_reference": "string",
     *   "timestamp": "unix_timestamp",
     *   "signature": "hmac_signature"
     * }
     */
    public function handle(Request $request): JsonResponse
    {
        $startTime = microtime(true);
        
        try {
            // Log incoming webhook
            Log::info('Payment webhook received', [
                'ip' => $request->ip(),
                'payload' => $this->sanitizePayload($request->all()),
            ]);

            // Validate basic structure
            $validated = $request->validate([
                'status' => 'required|string|in:success,failed,pending,completed,error',
                'timestamp' => 'nullable|integer',
            ]);

            // Security checks (only in production)
            if (app()->environment('production')) {
                $this->verifyWebhookSecurity($request);
            }

            // Process the webhook
            $payment = $this->paymentService->processWebhook($request->all());

            $processingTime = round((microtime(true) - $startTime) * 1000, 2);

            Log::info('Payment webhook processed successfully', [
                'payment_id' => $payment->id,
                'status' => $payment->status,
                'processing_time_ms' => $processingTime,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Webhook processed',
                'payment_status' => $payment->status,
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Payment webhook validation failed', [
                'errors' => $e->errors(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Invalid payload',
                'details' => $e->errors(),
            ], 400);

        } catch (\Exception $e) {
            Log::error('Payment webhook processing failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Webhook processing failed',
            ], 500);
        }
    }

    /**
     * Handle successful payment callback (legacy endpoint).
     * 
     * POST /api/payments/webhook/success
     */
    public function handleSuccess(Request $request, InvoiceService $invoiceService): JsonResponse
    {
        $validated = $request->validate([
            'transaction_id' => ['required', 'string'],
        ]);

        try {
            DB::transaction(function () use ($validated, $invoiceService) {
                $payment = Payment::where('transaction_id', $validated['transaction_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                $oldStatus = $payment->status;

                $payment->forceFill([
                    'status' => 'completed',
                    'processed_at' => now(),
                ])->save();

                PaymentAuditLog::logWebhook($payment, 'legacy_success', $oldStatus, 'completed');

                $invoice = $payment->invoice()->lockForUpdate()->firstOrFail();
                $invoice->loadMissing('payments', 'order');

                $invoiceService->reconcileStatus($invoice);
            });

            return response()->json(['ok' => true]);

        } catch (\Exception $e) {
            Log::error('Legacy webhook processing failed', [
                'transaction_id' => $validated['transaction_id'],
                'error' => $e->getMessage(),
            ]);

            return response()->json(['ok' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Verify webhook security (signature, IP, replay protection).
     */
    protected function verifyWebhookSecurity(Request $request): void
    {
        // 1. IP Whitelist check
        $allowedIps = config('payment.webhook_allowed_ips', []);
        if (!empty($allowedIps) && !in_array($request->ip(), $allowedIps)) {
            Log::warning('Webhook from unauthorized IP', ['ip' => $request->ip()]);
            throw new \Exception('Unauthorized IP address');
        }

        // 2. Signature verification
        $signature = $request->header('X-Payment-Signature');
        if ($signature) {
            $this->verifySignature($request, $signature);
        }

        // 3. Timestamp check (prevent replay attacks - 5 min window)
        $timestamp = $request->input('timestamp');
        if ($timestamp && abs(time() - (int)$timestamp) > 300) {
            throw new \Exception('Webhook timestamp expired');
        }

        // 4. Nonce/idempotency check
        $nonce = $request->header('X-Payment-Nonce') ?? $request->input('nonce');
        if ($nonce) {
            $cacheKey = "webhook_nonce:{$nonce}";
            if (Cache::has($cacheKey)) {
                throw new \Exception('Duplicate webhook (nonce already used)');
            }
            Cache::put($cacheKey, true, 3600); // Store for 1 hour
        }
    }

    /**
     * Verify HMAC signature.
     */
    protected function verifySignature(Request $request, string $signature): void
    {
        $secret = config('payment.webhook_secret');
        if (!$secret) {
            return; // No secret configured, skip verification
        }

        // Build payload string for signature
        $payload = collect([
            $request->input('transaction_id'),
            $request->input('qr_reference'),
            $request->input('amount'),
            $request->input('timestamp'),
        ])->filter()->implode('|');

        $expectedSignature = hash_hmac('sha256', $payload, $secret);

        if (!hash_equals($expectedSignature, $signature)) {
            Log::warning('Webhook signature mismatch', [
                'received' => substr($signature, 0, 20) . '...',
            ]);
            throw new \Exception('Invalid webhook signature');
        }
    }

    /**
     * Sanitize payload for logging (remove sensitive data).
     */
    protected function sanitizePayload(array $payload): array
    {
        $sensitive = ['signature', 'secret', 'token', 'api_key'];
        
        foreach ($sensitive as $key) {
            if (isset($payload[$key])) {
                $payload[$key] = '***REDACTED***';
            }
        }

        return $payload;
    }
}


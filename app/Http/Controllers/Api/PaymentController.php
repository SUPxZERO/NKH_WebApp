<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse; // Sprint 2A: API Standardization
use App\Models\Order;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    use ApiResponse; // Sprint 2A
    protected PaymentService $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    /**
     * Get available payment methods.
     * 
     * GET /api/payment-methods
     */
    public function availableMethods(): JsonResponse
    {
        $methods = \Illuminate\Support\Facades\Cache::remember('payment_methods.active', 300, function () {
            return \App\Models\PaymentMethod::where('is_active', true)
                ->orderBy('display_order')
                ->get()
                ->map(function ($method) {
                    return [
                        'id' => $method->id,
                        'code' => $method->code,
                        'name' => $method->name,
                        'type' => $method->type,
                        'description' => $method->description,
                        'processing_fee' => (float) ($method->processing_fee ?? 0),
                        'icon' => $this->getPaymentMethodIcon($method->code),
                    ];
                });
        });

        return $this->success($methods, 'Payment methods retrieved');
    }

    /**
     * Get icon identifier for payment method
     */
    private function getPaymentMethodIcon(string $code): string
    {
        return match ($code) {
            'qr', 'aba_pay', 'wing' => 'qr-code',
            'cash' => 'banknotes',
            'card' => 'credit-card',
            default => 'currency-dollar',
        };
    }

    /**
     * Initiate a payment for an order.
     * 
     * POST /api/payments/initiate
     */
    public function initiate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'payment_method' => 'nullable|string|exists:payment_methods,code',
        ]);

        try {
            $order = Order::findOrFail($validated['order_id']);

            // Check if user can pay for this order
            if ($order->customer_id && auth()->check()) {
                $user = auth()->user();
                if ($user->customer && $user->customer->id !== $order->customer_id) {
                    return response()->json([
                        'success' => false,
                        'error' => 'Unauthorized to pay for this order',
                    ], 403);
                }
            }

            $paymentMethod = $validated['payment_method'] ?? 'qr';
            $result = $this->paymentService->initiatePayment($order, $paymentMethod);

            // Load the created payment to get full details
            $payment = Payment::find($result['payment_id']);
            $payment->load('invoice.order');

            // Build response matching PaymentInitResponse interface
            $response = [
                'success' => $result['success'] ?? true,
                'type' => $this->getPaymentType($paymentMethod),
                'payment' => [
                    'id' => $payment->id,
                    'uuid' => $payment->uuid,
                    'status' => $payment->status,
                    'amount' => (float) $payment->amount,
                    'currency' => $payment->currency,
                    'reference_number' => $payment->reference_number,
                    'transaction_id' => $payment->transaction_id,
                    'expires_at' => $payment->expires_at?->toIso8601String(),
                    'expires_in_seconds' => $payment->expires_at
                        ? max(0, now()->diffInSeconds($payment->expires_at, false))
                        : null,
                ],
                'order' => [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'total' => (float) $order->total_amount,
                ],
            ];

            // Add QR code data if available
            if (in_array($paymentMethod, ['qr', 'aba_pay', 'wing']) && $payment->qr_reference) {
                try {
                    $khqrService = app(\App\Services\Payment\KhqrService::class);
                    $qrData = $khqrService->generateKhqr($payment, $order);

                    $response['qr_code'] = [
                        'data' => $qrData['qr_string'],
                        'reference' => $payment->qr_reference,
                        'md5_hash' => $qrData['md5_hash'],
                        'image_svg' => $khqrService->generateQrSvg($qrData['qr_string']),
                        'image_base64' => $khqrService->generateQrBase64($qrData['qr_string']),
                        'bakong_account' => $qrData['bakong_account_id'],
                    ];
                } catch (\Exception $e) {
                    // QR generation failed, but payment was created - log and continue
                    Log::warning('KHQR generation failed after payment creation', [
                        'payment_id' => $payment->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            return response()->json($response);

        } catch (\Exception $e) {
            Log::error('Payment initiation failed', [
                'order_id' => $validated['order_id'],
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to initiate payment',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get payment type based on payment method code
     */
    private function getPaymentType(string $methodCode): string
    {
        return match ($methodCode) {
            'qr', 'aba_pay', 'wing' => 'qr',
            'cash' => 'cash',
            'card' => 'card',
            default => 'qr',
        };
    }

    /**
     * Get payment status.
     *
     * GET /api/payments/{payment}/status
     *
     * Returns a flattened status payload that matches the frontend PaymentStatus type.
     */
    public function status(Payment $payment): JsonResponse
    {
        try {
            $payment->refresh();

            $data = [
                'payment_id' => $payment->id,
                'uuid' => $payment->uuid,
                'status' => $payment->status,
                'amount' => (float) $payment->amount,
                'currency' => $payment->currency,
                'reference_number' => $payment->reference_number,
                'transaction_id' => $payment->transaction_id,
                'created_at' => $payment->created_at?->toIso8601String(),
                'expires_at' => $payment->expires_at?->toIso8601String(),
                'is_expired' => $payment->isExpired(),
                'processed_at' => $payment->processed_at?->toIso8601String(),
                'failure_reason' => $payment->failure_reason,
                'can_retry' => $payment->canRetry(),
            ];

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get payment by UUID (for frontend polling).
     * 
     * GET /api/payments/uuid/{uuid}
     */
    public function showByUuid(string $uuid): JsonResponse
    {
        $payment = Payment::where('uuid', $uuid)->first();

        if (!$payment) {
            return response()->json([
                'success' => false,
                'error' => 'Payment not found',
            ], 404);
        }

        return $this->status($payment);
    }

    /**
     * Cancel a pending payment.
     * 
     * POST /api/payments/{payment}/cancel
     */
    public function cancel(Payment $payment, Request $request): JsonResponse
    {
        $reason = $request->input('reason', 'User cancelled');

        try {
            $success = $this->paymentService->cancelPayment($payment, $reason);

            if (!$success) {
                return response()->json([
                    'success' => false,
                    'error' => 'Cannot cancel this payment',
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => 'Payment cancelled successfully',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Retry a failed payment.
     * 
     * POST /api/payments/{payment}/retry
     */
    public function retry(Payment $payment): JsonResponse
    {
        try {
            $result = $this->paymentService->retryPayment($payment);

            return response()->json($result);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Verify KHQR payment with Bakong API.
     * 
     * POST /api/payments/{payment}/verify-bakong
     */
    public function verifyBakongTransaction(Payment $payment): JsonResponse
    {
        try {
            // Get MD5 hash from payment metadata
            $md5Hash = $payment->metadata['khqr_md5'] ?? null;

            if (!$md5Hash) {
                // Regenerate MD5 if not stored
                $khqrService = app(\App\Services\Payment\KhqrService::class);
                $order = $payment->invoice?->order;
                if ($order) {
                    $qrData = $khqrService->generateKhqr($payment, $order);
                    $md5Hash = $qrData['md5_hash'];
                }
            }

            if (!$md5Hash) {
                return response()->json([
                    'success' => false,
                    'error' => 'No KHQR hash available for verification',
                ], 400);
            }

            // Check with Bakong API
            $bakongService = app(\App\Services\BakongApiService::class);
            $result = $bakongService->checkTransactionByMd5($md5Hash);

            if ($result && $result['found']) {
                // Transaction found - mark payment as complete
                if ($payment->isPending()) {
                    $this->paymentService->processWebhook([
                        'qr_reference' => $payment->qr_reference,
                        'status' => 'completed',
                        'transaction_id' => $result['data']['transactionId'] ?? null,
                    ]);
                    $payment->refresh();
                }

                return response()->json([
                    'success' => true,
                    'found' => true,
                    'payment_status' => $payment->status,
                    'transaction_data' => $result['data'],
                ]);
            }

            return response()->json([
                'success' => true,
                'found' => false,
                'message' => $result['message'] ?? 'Transaction not found yet',
                'payment_status' => $payment->status,
            ]);

        } catch (\Exception $e) {
            Log::error('Bakong verification failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Verification failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get QR code for a payment.
     * 
     * GET /api/payments/{payment}/qr
     */
    public function getQrCode(Payment $payment): JsonResponse
    {
        if (!$payment->isPending()) {
            return response()->json([
                'success' => false,
                'error' => 'Payment is no longer pending',
            ], 400);
        }

        $payment->load('invoice.order');
        $order = $payment->invoice->order;

        $qrGenerator = app(\App\Services\QrCodeGenerator::class);
        $qrData = $qrGenerator->generateQrkhData($payment, $order);

        return response()->json([
            'success' => true,
            'data' => [
                'qr_data' => $qrData['qr_data'],
                'qr_reference' => $payment->qr_reference,
                'image_svg' => $qrGenerator->generateSvg($qrData['qr_data']),
                'image_base64' => $qrGenerator->generateBase64($qrData['qr_data']),
                'expires_at' => $payment->expires_at?->toIso8601String(),
                'expires_in_seconds' => $payment->expires_at
                    ? max(0, now()->diffInSeconds($payment->expires_at, false))
                    : null,
            ],
        ]);
    }

    /**
     * Simulate payment success (for development/testing only).
     * 
     * POST /api/payments/{payment}/simulate-success
     */
    public function simulateSuccess(Payment $payment): JsonResponse
    {
        if (!app()->environment('local', 'development', 'testing')) {
            return response()->json([
                'success' => false,
                'error' => 'Simulation only available in development',
            ], 403);
        }

        try {
            // Check if payment is still pending
            if (!$payment->isPending()) {
                // If already completed, treat simulation as idempotent success
                if ($payment->isCompleted()) {
                    return response()->json([
                        'success' => true,
                        'message' => 'Payment already completed; no simulation needed',
                        'payment' => $this->paymentService->getPaymentStatus($payment),
                    ]);
                }

                return response()->json([
                    'success' => false,
                    'error' => 'Payment is not in pending status',
                ], 400);
            }

            // For payments with qr_reference, use the webhook flow
            if ($payment->qr_reference) {
                $result = $this->paymentService->processWebhook([
                    'qr_reference' => $payment->qr_reference,
                    'status' => 'success',
                    'gateway_reference' => 'SIM-' . now()->format('YmdHis'),
                ]);
            } else {
                // For non-QR payments (cash, card without gateway), also go through the
                // webhook-style processing so invoice/order logic stays consistent.
                $result = $this->paymentService->processWebhook([
                    'transaction_id' => $payment->transaction_id,
                    'reference_number' => $payment->reference_number,
                    'status' => 'success',
                    'gateway_reference' => 'SIM-' . now()->format('YmdHis'),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Payment simulated successfully',
                'payment' => $this->paymentService->getPaymentStatus($result),
            ]);

        } catch (\Exception $e) {
            Log::error('Payment simulation failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Simulate payment failure (for development/testing only).
     * 
     * POST /api/payments/{payment}/simulate-failure
     */
    public function simulateFailure(Payment $payment, Request $request): JsonResponse
    {
        if (!app()->environment('local', 'development', 'testing')) {
            return response()->json([
                'success' => false,
                'error' => 'Simulation only available in development',
            ], 403);
        }

        $reason = $request->input('reason', 'Simulated payment failure');

        try {
            // Check if payment is still pending
            if (!$payment->isPending()) {
                // If already failed or cancelled, treat simulation as idempotent
                if ($payment->isFailed() || $payment->isCancelled()) {
                    return response()->json([
                        'success' => true,
                        'message' => 'Payment already failed/cancelled; no simulation needed',
                        'payment' => $this->paymentService->getPaymentStatus($payment),
                    ]);
                }

                return response()->json([
                    'success' => false,
                    'error' => 'Payment is not in pending status',
                ], 400);
            }

            // For payments with qr_reference, use the webhook flow
            if ($payment->qr_reference) {
                $result = $this->paymentService->processWebhook([
                    'qr_reference' => $payment->qr_reference,
                    'status' => 'failed',
                    'failure_reason' => $reason,
                ]);
            } else {
                // For non-QR payments, directly update the status
                $payment->markAsFailed($reason);
                $result = $payment->fresh();
            }

            return response()->json([
                'success' => true,
                'message' => 'Payment failure simulated',
                'payment' => $this->paymentService->getPaymentStatus($result),
            ]);

        } catch (\Exception $e) {
            Log::error('Payment failure simulation failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

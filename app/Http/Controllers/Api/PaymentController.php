<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
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
        $methods = \App\Models\PaymentMethod::where('is_active', true)
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

        return response()->json([
            'success' => true,
            'data' => $methods,
        ]);
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

            return response()->json($result);

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
     * Get payment status.
     * 
     * GET /api/payments/{payment}/status
     */
    public function status(Payment $payment): JsonResponse
    {
        try {
            $status = $this->paymentService->getPaymentStatus($payment);

            return response()->json([
                'success' => true,
                'data' => $status,
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
                // For non-QR payments (cash, card without gateway), directly update
                $payment->markAsCompleted('SIM-' . now()->format('YmdHis'));
                
                // Update associated invoice and order
                if ($payment->invoice) {
                    $payment->invoice->update(['status' => 'paid', 'paid_at' => now()]);
                    
                    if ($payment->invoice->order) {
                        $payment->invoice->order->update(['payment_status' => 'paid']);
                    }
                }
                
                $result = $payment->fresh();
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

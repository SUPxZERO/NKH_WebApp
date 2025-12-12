<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SplitPaymentController extends Controller
{
    protected PaymentService $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    /**
     * Get payment session status for an order.
     * Shows all payments and remaining balance.
     * 
     * GET /api/payments/split/{order}/status
     */
    public function status(Order $order): JsonResponse
    {
        $invoice = $order->invoice;

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'error' => 'No invoice found for this order',
            ], 404);
        }

        $payments = $invoice->payments()
            ->with('paymentMethod')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'uuid' => $payment->uuid,
                    'amount' => (float) $payment->amount,
                    'currency' => $payment->currency,
                    'status' => $payment->status,
                    'method' => $payment->paymentMethod?->name,
                    'method_code' => $payment->paymentMethod?->code,
                    'created_at' => $payment->created_at->toIso8601String(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'order' => [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'total' => (float) $order->total_amount,
                ],
                'invoice' => [
                    'id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                    'total_amount' => (float) $invoice->total_amount,
                    'amount_paid' => (float) $invoice->completed_amount,
                    'remaining_balance' => (float) $invoice->remaining_balance,
                    'payment_progress' => $invoice->payment_progress,
                    'is_fully_paid' => $invoice->isFullyPaid(),
                    'status' => $invoice->status,
                ],
                'payments' => $payments,
                'can_add_payment' => $invoice->canAcceptPayment(),
            ],
        ]);
    }

    /**
     * Add a split payment to an order.
     * 
     * POST /api/payments/split/{order}/add
     */
    public function addPayment(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'payment_method' => 'required|string|exists:payment_methods,code',
            'amount' => 'required|numeric|min:0.01',
        ]);

        $invoice = $order->invoice;

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'error' => 'No invoice found for this order',
            ], 404);
        }

        if (!$invoice->canAcceptPayment()) {
            return response()->json([
                'success' => false,
                'error' => 'This invoice cannot accept more payments',
            ], 400);
        }

        $amount = (float) $validated['amount'];
        $remainingBalance = (float) $invoice->remaining_balance;

        // Validate amount doesn't exceed remaining balance
        if ($amount > $remainingBalance) {
            return response()->json([
                'success' => false,
                'error' => "Amount exceeds remaining balance of \${$remainingBalance}",
                'remaining_balance' => $remainingBalance,
            ], 400);
        }

        try {
            // Initiate the payment with the specified amount and tip
            $result = $this->paymentService->initiatePayment(
                $order,
                $validated['payment_method'],
                $amount,
                $request->user()?->id,
                $validated['tip'] ?? 0 // Pass tip
            );

            return response()->json(array_merge($result, [
                'split_payment' => true,
                'remaining_after_this' => $remainingBalance - $amount,
            ]), $result['success'] ? 200 : 400);

        } catch (\Exception $e) {
            Log::error('Split payment initiation failed', [
                'order_id' => $order->id,
                'amount' => $amount,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to initiate split payment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Calculate suggested split amounts.
     * 
     * GET /api/payments/split/{order}/suggestions
     */
    public function suggestions(Order $order): JsonResponse
    {
        $invoice = $order->invoice;

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'error' => 'No invoice found for this order',
            ], 404);
        }

        $total = (float) $invoice->total_amount;
        $remaining = (float) $invoice->remaining_balance;

        // Generate common split suggestions
        $suggestions = [];

        // If not started, suggest common splits
        if ($remaining === $total) {
            $suggestions = [
                ['label' => 'Pay Full Amount', 'amount' => $total],
                ['label' => 'Split 50/50', 'amount' => round($total / 2, 2)],
                ['label' => 'Split 60/40', 'amount' => round($total * 0.6, 2)],
                ['label' => 'Pay $20', 'amount' => min(20, $total)],
                ['label' => 'Pay $50', 'amount' => min(50, $total)],
            ];
        } else {
            // If partially paid, suggest remaining balance
            $suggestions = [
                ['label' => 'Pay Remaining Balance', 'amount' => $remaining],
                ['label' => 'Pay Half Remaining', 'amount' => round($remaining / 2, 2)],
            ];

            if ($remaining > 20) {
                $suggestions[] = ['label' => 'Pay $20', 'amount' => 20];
            }
        }

        // Filter out suggestions with amounts > remaining
        $suggestions = array_filter($suggestions, fn($s) => $s['amount'] <= $remaining && $s['amount'] > 0);

        return response()->json([
            'success' => true,
            'data' => [
                'total_amount' => $total,
                'remaining_balance' => $remaining,
                'suggestions' => array_values($suggestions),
            ],
        ]);
    }

    /**
     * Cancel a pending split payment.
     * 
     * POST /api/payments/split/{order}/cancel/{payment}
     */
    public function cancelPayment(Order $order, Payment $payment): JsonResponse
    {
        // Verify payment belongs to this order
        if ($payment->invoice_id !== $order->invoice?->id) {
            return response()->json([
                'success' => false,
                'error' => 'Payment does not belong to this order',
            ], 400);
        }

        if (!$payment->isPending()) {
            return response()->json([
                'success' => false,
                'error' => 'Only pending payments can be cancelled',
            ], 400);
        }

        try {
            $result = $this->paymentService->cancelPayment($payment);
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to cancel payment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Complete the payment session (verify all payments).
     * 
     * POST /api/payments/split/{order}/complete
     */
    public function complete(Order $order): JsonResponse
    {
        $invoice = $order->invoice;

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'error' => 'No invoice found for this order',
            ], 404);
        }

        // Check if fully paid
        if (!$invoice->isFullyPaid()) {
            return response()->json([
                'success' => false,
                'error' => 'Invoice is not fully paid',
                'remaining_balance' => (float) $invoice->remaining_balance,
            ], 400);
        }

        // Check for pending payments
        $pendingPayments = $invoice->payments()
            ->where('status', Payment::STATUS_PENDING)
            ->count();

        if ($pendingPayments > 0) {
            return response()->json([
                'success' => false,
                'error' => "There are {$pendingPayments} pending payments that need to complete first",
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment session completed successfully',
            'data' => [
                'invoice_status' => $invoice->status,
                'total_paid' => (float) $invoice->completed_amount,
                'payment_count' => $invoice->payments()->where('status', Payment::STATUS_COMPLETED)->count(),
            ],
        ]);
    }
}

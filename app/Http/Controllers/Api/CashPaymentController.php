<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\PaymentAuditLog;
use App\Services\InvoiceService;
use App\Services\LoyaltyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CashPaymentController extends Controller
{
    protected InvoiceService $invoiceService;
    protected LoyaltyService $loyaltyService;

    public function __construct(InvoiceService $invoiceService, LoyaltyService $loyaltyService)
    {
        $this->invoiceService = $invoiceService;
        $this->loyaltyService = $loyaltyService;
    }

    /**
     * Get pending cash payments for the current location.
     * 
     * GET /api/employee/payments/pending-cash
     */
    public function pendingCashPayments(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Get the employee's location if assigned
        $locationId = $user->employee?->location_id;

        $query = Payment::with(['invoice.order.customer.user', 'invoice.order.items', 'paymentMethod'])
            ->whereHas('paymentMethod', function ($q) {
                $q->where('code', 'cash');
            })
            ->where('status', Payment::STATUS_PENDING)
            ->orderBy('created_at', 'asc');

        // Filter by location if employee has one assigned
        if ($locationId) {
            $query->whereHas('invoice.order', function ($q) use ($locationId) {
                $q->where('location_id', $locationId);
            });
        }

        $payments = $query->get()->map(function ($payment) {
            $order = $payment->invoice->order;
            return [
                'id' => $payment->id,
                'uuid' => $payment->uuid,
                'amount' => (float) $payment->amount,
                'currency' => $payment->currency,
                'reference_number' => $payment->reference_number,
                'created_at' => $payment->created_at->toIso8601String(),
                'waiting_time' => $payment->created_at->diffForHumans(),
                'order' => [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer_name' => $order->customer?->user?->name ?? 'Guest',
                    'items_count' => $order->items->count(),
                ],
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $payments,
            'count' => $payments->count(),
        ]);
    }

    /**
     * Confirm a cash payment.
     * 
     * POST /api/employee/payments/{payment}/confirm-cash
     */
    public function confirmCashPayment(Payment $payment, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cash_received' => 'required|numeric|min:' . $payment->amount,
            'notes' => 'nullable|string|max:500',
        ]);

        // Verify this is a cash payment
        if ($payment->paymentMethod->code !== 'cash') {
            return response()->json([
                'success' => false,
                'error' => 'This is not a cash payment',
            ], 400);
        }

        // Verify payment is still pending
        if (!$payment->isPending()) {
            return response()->json([
                'success' => false,
                'error' => 'Payment is no longer pending',
                'current_status' => $payment->status,
            ], 400);
        }

        try {
            DB::transaction(function () use ($payment, $validated, $request) {
                $cashReceived = (float) $validated['cash_received'];
                $changeGiven = $cashReceived - (float) $payment->amount;

                // Update payment
                $payment->update([
                    'status' => Payment::STATUS_COMPLETED,
                    'cash_received' => $cashReceived,
                    'change_given' => $changeGiven,
                    'confirmed_by' => $request->user()->id,
                    'confirmed_at' => now(),
                    'processed_at' => now(),
                    'notes' => $validated['notes'] ?? $payment->notes,
                ]);

                // Log the confirmation
                PaymentAuditLog::log(
                    $payment,
                    'cash_confirmed',
                    Payment::STATUS_PENDING,
                    Payment::STATUS_COMPLETED,
                    $request->user()->id,
                    [
                        'cash_received' => $cashReceived,
                        'change_given' => $changeGiven,
                        'confirmed_by_name' => $request->user()->name,
                    ]
                );

                // Update invoice
                $invoice = $payment->invoice;
                $invoice->loadMissing('payments', 'order');
                $this->invoiceService->reconcileStatus($invoice);

                // Award loyalty points
                if ($invoice->order) {
                    $this->loyaltyService->awardPoints($invoice->order);
                }
            });

            $payment->refresh();
            $payment->load('confirmedBy');

            return response()->json([
                'success' => true,
                'message' => 'Cash payment confirmed successfully',
                'data' => [
                    'payment_id' => $payment->id,
                    'status' => $payment->status,
                    'cash_received' => (float) $payment->cash_received,
                    'change_given' => (float) $payment->change_given,
                    'confirmed_at' => $payment->confirmed_at->toIso8601String(),
                    'confirmed_by' => $payment->confirmedBy->name ?? null,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Cash payment confirmation failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to confirm payment',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reject/cancel a cash payment.
     * 
     * POST /api/employee/payments/{payment}/reject-cash
     */
    public function rejectCashPayment(Payment $payment, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        // Verify this is a cash payment
        if ($payment->paymentMethod->code !== 'cash') {
            return response()->json([
                'success' => false,
                'error' => 'This is not a cash payment',
            ], 400);
        }

        // Verify payment is still pending
        if (!$payment->isPending()) {
            return response()->json([
                'success' => false,
                'error' => 'Payment is no longer pending',
            ], 400);
        }

        $payment->update([
            'status' => Payment::STATUS_CANCELLED,
            'failure_reason' => $validated['reason'],
            'confirmed_by' => $request->user()->id,
            'confirmed_at' => now(),
        ]);

        PaymentAuditLog::log(
            $payment,
            'cash_rejected',
            Payment::STATUS_PENDING,
            Payment::STATUS_CANCELLED,
            $request->user()->id,
            ['reason' => $validated['reason']]
        );

        return response()->json([
            'success' => true,
            'message' => 'Cash payment rejected',
        ]);
    }

    /**
     * Get cash payment statistics for the current shift.
     * 
     * GET /api/employee/payments/cash-stats
     */
    public function cashStats(Request $request): JsonResponse
    {
        $user = $request->user();
        $locationId = $user->employee?->location_id;

        // Get today's stats
        $todayStart = now()->startOfDay();

        $query = Payment::whereHas('paymentMethod', fn($q) => $q->where('code', 'cash'))
            ->where('confirmed_by', $user->id)
            ->where('confirmed_at', '>=', $todayStart);

        $stats = [
            'total_confirmed' => $query->where('status', Payment::STATUS_COMPLETED)->count(),
            'total_amount' => (float) $query->where('status', Payment::STATUS_COMPLETED)->sum('amount'),
            'total_cash_received' => (float) $query->where('status', Payment::STATUS_COMPLETED)->sum('cash_received'),
            'total_change_given' => (float) $query->where('status', Payment::STATUS_COMPLETED)->sum('change_given'),
            'pending_count' => Payment::whereHas('paymentMethod', fn($q) => $q->where('code', 'cash'))
                ->where('status', Payment::STATUS_PENDING)
                ->when($locationId, fn($q) => $q->whereHas('invoice.order', fn($q2) => $q2->where('location_id', $locationId)))
                ->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}

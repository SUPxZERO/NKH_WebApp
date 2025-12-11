<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\PaymentAuditLog;
use App\Services\Payment\Strategies\StripePaymentStrategy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RefundController extends Controller
{
    /**
     * List all refunds with filters.
     * 
     * GET /api/admin/refunds
     */
    public function index(Request $request): JsonResponse
    {
        $query = Refund::with(['payment.paymentMethod', 'payment.invoice.order', 'initiator', 'approver'])
            ->orderBy('created_at', 'desc');

        // Status filter
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Date range filter
        if ($request->has('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->has('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        $refunds = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $refunds->items(),
            'meta' => [
                'current_page' => $refunds->currentPage(),
                'last_page' => $refunds->lastPage(),
                'per_page' => $refunds->perPage(),
                'total' => $refunds->total(),
            ],
        ]);
    }

    /**
     * Get refund statistics.
     * 
     * GET /api/admin/refunds/stats
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'pending_count' => Refund::pending()->count(),
            'approved_count' => Refund::approved()->count(),
            'completed_count' => Refund::completed()->count(),
            'rejected_count' => Refund::where('status', 'rejected')->count(),
            'pending_amount' => (float) Refund::pending()->sum('amount'),
            'completed_amount_today' => (float) Refund::completed()
                ->whereDate('processed_at', today())
                ->sum('amount'),
            'completed_amount_month' => (float) Refund::completed()
                ->whereMonth('processed_at', now()->month)
                ->whereYear('processed_at', now()->year)
                ->sum('amount'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Request a refund for a payment.
     * 
     * POST /api/admin/refunds
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payment_id' => 'required|exists:payments,id',
            'amount' => 'required|numeric|min:0.01',
            'reason' => 'required|string|max:500',
            'notes' => 'nullable|string|max:1000',
        ]);

        $payment = Payment::findOrFail($validated['payment_id']);

        // Check if payment can be refunded
        if (!$payment->isCompleted()) {
            return response()->json([
                'success' => false,
                'error' => 'Only completed payments can be refunded',
            ], 400);
        }

        // Check refund amount doesn't exceed remaining refundable
        $existingRefunds = $payment->refunds()
            ->whereIn('status', ['pending', 'approved', 'completed'])
            ->sum('amount');
        
        $refundableAmount = $payment->amount - $existingRefunds;
        
        if ($validated['amount'] > $refundableAmount) {
            return response()->json([
                'success' => false,
                'error' => "Maximum refundable amount is {$refundableAmount}",
                'max_refundable' => $refundableAmount,
            ], 400);
        }

        $refund = Refund::create([
            'payment_id' => $payment->id,
            'amount' => $validated['amount'],
            'reason' => $validated['reason'],
            'notes' => $validated['notes'] ?? null,
            'status' => 'pending',
            'initiated_by' => $request->user()->id,
        ]);

        PaymentAuditLog::log(
            $payment,
            'refund_requested',
            $payment->status,
            $payment->status,
            $request->user()->id,
            [
                'refund_id' => $refund->id,
                'amount' => $validated['amount'],
                'reason' => $validated['reason'],
            ]
        );

        $refund->load('payment', 'initiator');

        return response()->json([
            'success' => true,
            'message' => 'Refund request created',
            'data' => $refund,
        ], 201);
    }

    /**
     * Show refund details.
     * 
     * GET /api/admin/refunds/{refund}
     */
    public function show(Refund $refund): JsonResponse
    {
        $refund->load([
            'payment.paymentMethod',
            'payment.invoice.order.customer.user',
            'initiator',
            'approver',
        ]);

        return response()->json([
            'success' => true,
            'data' => $refund,
        ]);
    }

    /**
     * Approve a pending refund.
     * 
     * POST /api/admin/refunds/{refund}/approve
     */
    public function approve(Refund $refund, Request $request): JsonResponse
    {
        if (!$refund->isPending()) {
            return response()->json([
                'success' => false,
                'error' => 'Refund is not pending approval',
            ], 400);
        }

        $refund->update([
            'status' => 'approved',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        PaymentAuditLog::log(
            $refund->payment,
            'refund_approved',
            $refund->payment->status,
            $refund->payment->status,
            $request->user()->id,
            [
                'refund_id' => $refund->id,
                'amount' => $refund->amount,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Refund approved',
            'data' => $refund->fresh(['approver']),
        ]);
    }

    /**
     * Reject a pending refund.
     * 
     * POST /api/admin/refunds/{refund}/reject
     */
    public function reject(Refund $refund, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        if (!$refund->isPending()) {
            return response()->json([
                'success' => false,
                'error' => 'Refund is not pending',
            ], 400);
        }

        $refund->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['reason'],
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        PaymentAuditLog::log(
            $refund->payment,
            'refund_rejected',
            $refund->payment->status,
            $refund->payment->status,
            $request->user()->id,
            [
                'refund_id' => $refund->id,
                'rejection_reason' => $validated['reason'],
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Refund rejected',
        ]);
    }

    /**
     * Process an approved refund.
     * 
     * POST /api/admin/refunds/{refund}/process
     */
    public function process(Refund $refund, Request $request): JsonResponse
    {
        if (!$refund->isApproved()) {
            return response()->json([
                'success' => false,
                'error' => 'Refund must be approved before processing',
            ], 400);
        }

        $payment = $refund->payment;
        $payment->load('paymentMethod');

        try {
            DB::transaction(function () use ($refund, $payment, $request) {
                $gatewayReference = null;

                // Process refund based on payment method
                if ($payment->paymentMethod->code === 'card' && $payment->gateway_reference) {
                    // Stripe refund
                    $gatewayReference = $this->processStripeRefund($payment, $refund);
                }
                // For other methods (cash, QR), refund is manual

                $refund->update([
                    'status' => 'completed',
                    'processed_at' => now(),
                    'gateway_reference' => $gatewayReference,
                ]);

                // Update payment status if fully refunded
                $totalRefunded = $payment->refunds()
                    ->where('status', 'completed')
                    ->sum('amount');
                
                if ($totalRefunded >= $payment->amount) {
                    $payment->update(['status' => Payment::STATUS_REFUNDED]);
                }

                PaymentAuditLog::log(
                    $payment,
                    'refund_processed',
                    $payment->status,
                    $payment->getOriginal('status') !== $payment->status ? Payment::STATUS_REFUNDED : $payment->status,
                    $request->user()->id,
                    [
                        'refund_id' => $refund->id,
                        'amount' => $refund->amount,
                        'gateway_reference' => $gatewayReference,
                    ]
                );
            });

            return response()->json([
                'success' => true,
                'message' => 'Refund processed successfully',
                'data' => $refund->fresh(),
            ]);

        } catch (\Exception $e) {
            Log::error('Refund processing failed', [
                'refund_id' => $refund->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to process refund: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Process Stripe refund.
     */
    protected function processStripeRefund(Payment $payment, Refund $refund): ?string
    {
        if (!config('services.stripe.secret')) {
            Log::warning('Stripe not configured for refund', [
                'refund_id' => $refund->id,
            ]);
            return null;
        }

        $stripeStrategy = app(StripePaymentStrategy::class);
        $amountInCents = (int) ($refund->amount * 100);

        $result = $stripeStrategy->refund($payment->gateway_reference, $amountInCents);

        return $result['id'] ?? null;
    }

    /**
     * Get refund history for a specific payment.
     * 
     * GET /api/admin/payments/{payment}/refunds
     */
    public function paymentRefunds(Payment $payment): JsonResponse
    {
        $refunds = $payment->refunds()
            ->with(['initiator', 'approver'])
            ->orderBy('created_at', 'desc')
            ->get();

        $totalRefunded = $refunds->where('status', 'completed')->sum('amount');
        $pendingRefunds = $refunds->where('status', 'pending')->sum('amount');

        return response()->json([
            'success' => true,
            'data' => [
                'refunds' => $refunds,
                'summary' => [
                    'payment_amount' => (float) $payment->amount,
                    'total_refunded' => (float) $totalRefunded,
                    'pending_refunds' => (float) $pendingRefunds,
                    'refundable_amount' => (float) ($payment->amount - $totalRefunded - $pendingRefunds),
                ],
            ],
        ]);
    }
}

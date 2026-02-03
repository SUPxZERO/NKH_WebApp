<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\PaymentMethodRequest;
use App\Models\DailySettlement;
use App\Models\Payment;
use App\Models\PaymentAuditLog;
use App\Models\PaymentMethod;
use App\Models\PaymentMethodAuditLog;
use App\Models\Refund;
use App\Services\InvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PaymentAdminController extends Controller
{
    /**
     * Get payment dashboard stats.
     */
    public function stats(Request $request): JsonResponse
    {
        $period = $request->input('period', 'today');
        $locationId = $request->input('location_id');

        $dateRange = $this->getDateRange($period);

        $query = Payment::query()
            ->whereBetween('created_at', [$dateRange['start'], $dateRange['end']]);

        if ($locationId) {
            $query->whereHas('invoice', fn($q) => $q->where('location_id', $locationId));
        }

        $allPayments = $query->get();

        $completed = $allPayments->where('status', 'completed');
        $failed = $allPayments->where('status', 'failed');
        $pending = $allPayments->where('status', 'pending');

        return response()->json([
            'total_payments' => $allPayments->count(),
            'total_revenue' => (float) $completed->sum('amount'),
            'completed_count' => $completed->count(),
            'failed_count' => $failed->count(),
            'pending_count' => $pending->count(),
            'success_rate' => $allPayments->count() > 0
                ? round(($completed->count() / $allPayments->count()) * 100, 1)
                : 0,
            'average_amount' => $completed->count() > 0
                ? round($completed->avg('amount'), 2)
                : 0,
            'period' => $period,
        ]);
    }

    /**
     * Get list of payments with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Payment::with(['invoice.order', 'paymentMethod', 'refunds'])
            ->orderBy('created_at', 'desc');

        // Filters
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($locationId = $request->input('location_id')) {
            $query->whereHas('invoice', fn($q) => $q->where('location_id', $locationId));
        }

        if ($from = $request->input('from')) {
            $query->whereDate('created_at', '>=', $from);
        }

        if ($to = $request->input('to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('reference_number', 'like', "%{$search}%")
                    ->orWhere('transaction_id', 'like', "%{$search}%")
                    ->orWhere('qr_reference', 'like', "%{$search}%");
            });
        }

        $payments = $query->paginate($request->input('per_page', 20));

        return response()->json($payments);
    }

    /**
     * Get payment details.
     */
    public function show(Payment $payment): JsonResponse
    {
        $payment->load([
            'invoice.order.customer',
            'paymentMethod',
            'refunds.initiator',
            'refunds.approver',
            'auditLogs.performer',
        ]);

        return response()->json([
            'payment' => $payment,
            'timeline' => $payment->auditLogs->sortBy('created_at')->values(),
        ]);
    }

    /**
     * Get audit log for a payment.
     */
    public function auditLog(Payment $payment): JsonResponse
    {
        $logs = $payment->auditLogs()
            ->with('performer')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($logs);
    }

    /**
     * Get refund statistics.
     */
    public function refundStats(Request $request): JsonResponse
    {
        $period = $request->input('period', 'month');
        $dateRange = $this->getDateRange($period);

        $refunds = Refund::whereBetween('created_at', [$dateRange['start'], $dateRange['end']])
            ->get();

        return response()->json([
            'total_refunds' => $refunds->count(),
            'total_amount' => (float) $refunds->where('status', 'completed')->sum('amount'),
            'pending_count' => $refunds->where('status', 'pending')->count(),
            'approved_count' => $refunds->where('status', 'approved')->count(),
            'completed_count' => $refunds->where('status', 'completed')->count(),
            'rejected_count' => $refunds->where('status', 'rejected')->count(),
            'period' => $period,
        ]);
    }

    /**
     * List refunds.
     */
    public function refunds(Request $request): JsonResponse
    {
        $query = Refund::with(['payment.invoice.order', 'initiator', 'approver'])
            ->orderBy('created_at', 'desc');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        return response()->json($query->paginate($request->input('per_page', 20)));
    }

    /**
     * Approve a refund.
     */
    public function approveRefund(Refund $refund): JsonResponse
    {
        if (!$refund->isPending()) {
            return response()->json([
                'success' => false,
                'error' => 'Refund is not pending',
            ], 400);
        }

        $refund->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'refund' => $refund->fresh(['approver']),
        ]);
    }

    /**
     * Reject a refund.
     */
    public function rejectRefund(Refund $refund, Request $request): JsonResponse
    {
        if (!$refund->isPending()) {
            return response()->json([
                'success' => false,
                'error' => 'Refund is not pending',
            ], 400);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        $refund->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['reason'],
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'refund' => $refund->fresh(),
        ]);
    }

    /**
     * Get daily settlements.
     */
    public function settlements(Request $request): JsonResponse
    {
        $query = DailySettlement::with(['location', 'reconciledBy'])
            ->orderBy('settlement_date', 'desc');

        if ($locationId = $request->input('location_id')) {
            $query->where('location_id', $locationId);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        return response()->json($query->paginate($request->input('per_page', 20)));
    }

    /**
     * Reconcile a settlement.
     */
    public function reconcileSettlement(DailySettlement $settlement): JsonResponse
    {
        if ($settlement->status !== 'pending') {
            return response()->json([
                'success' => false,
                'error' => 'Settlement is not pending',
            ], 400);
        }

        $settlement->update([
            'status' => 'reconciled',
            'reconciled_by' => auth()->id(),
            'reconciled_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'settlement' => $settlement->fresh(['reconciledBy']),
        ]);
    }

    /**
     * Revenue chart data.
     */
    public function revenueChart(Request $request): JsonResponse
    {
        $period = $request->input('period', 'week');
        $locationId = $request->input('location_id');

        $dateRange = $this->getDateRange($period);
        $groupBy = $period === 'year' ? 'month' : 'day';

        $query = Payment::where('status', 'completed')
            ->whereBetween('processed_at', [$dateRange['start'], $dateRange['end']]);

        if ($locationId) {
            $query->whereHas('invoice', fn($q) => $q->where('location_id', $locationId));
        }

        if ($groupBy === 'day') {
            $data = $query->selectRaw('DATE(processed_at) as date, SUM(amount) as total, COUNT(*) as count')
                ->groupBy('date')
                ->orderBy('date')
                ->get();
        } else {
            $data = $query->selectRaw('YEAR(processed_at) as year, MONTH(processed_at) as month, SUM(amount) as total, COUNT(*) as count')
                ->groupBy('year', 'month')
                ->orderBy('year')
                ->orderBy('month')
                ->get()
                ->map(fn($row) => [
                    'date' => sprintf('%d-%02d-01', $row->year, $row->month),
                    'total' => $row->total,
                    'count' => $row->count,
                ]);
        }

        return response()->json([
            'data' => $data,
            'period' => $period,
        ]);
    }

    /**
     * Get date range based on period.
     */
    protected function getDateRange(string $period): array
    {
        $now = now();

        return match ($period) {
            'today' => [
                'start' => $now->copy()->startOfDay(),
                'end' => $now->copy()->endOfDay(),
            ],
            'yesterday' => [
                'start' => $now->copy()->subDay()->startOfDay(),
                'end' => $now->copy()->subDay()->endOfDay(),
            ],
            'week' => [
                'start' => $now->copy()->startOfWeek(),
                'end' => $now->copy()->endOfWeek(),
            ],
            'month' => [
                'start' => $now->copy()->startOfMonth(),
                'end' => $now->copy()->endOfMonth(),
            ],
            'year' => [
                'start' => $now->copy()->startOfYear(),
                'end' => $now->copy()->endOfYear(),
            ],
            default => [
                'start' => $now->copy()->startOfDay(),
                'end' => $now->copy()->endOfDay(),
            ],
        };
    }

    /**
     * List all payment methods (active and inactive).
     * 
     * GET /api/admin/payment-methods
     */
    public function listPaymentMethods(Request $request): JsonResponse
    {
        $query = PaymentMethod::orderBy('display_order');

        // Optional filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $methods = $query->get()->map(function ($method) {
            return [
                'id' => $method->id,
                'name' => $method->name,
                'code' => $method->code,
                'type' => $method->type,
                'description' => $method->description,
                'processing_fee' => (float) $method->processing_fee,
                'display_order' => $method->display_order,
                'configuration' => $method->configuration,
                'is_active' => $method->is_active,
                'can_be_disabled' => $method->canBeDisabled(),
                'created_at' => $method->created_at?->toIso8601String(),
                'updated_at' => $method->updated_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $methods,
        ]);
    }

    /**
     * Get single payment method details.
     * 
     * GET /api/admin/payment-methods/{id}
     */
    public function showPaymentMethod(PaymentMethod $paymentMethod): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $paymentMethod->id,
                'name' => $paymentMethod->name,
                'code' => $paymentMethod->code,
                'type' => $paymentMethod->type,
                'description' => $paymentMethod->description,
                'processing_fee' => (float) $paymentMethod->processing_fee,
                'display_order' => $paymentMethod->display_order,
                'configuration' => $paymentMethod->configuration,
                'is_active' => $paymentMethod->is_active,
                'can_be_disabled' => $paymentMethod->canBeDisabled(),
                'created_at' => $paymentMethod->created_at?->toIso8601String(),
                'updated_at' => $paymentMethod->updated_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Update payment method configuration.
     * 
     * PUT /api/admin/payment-methods/{id}
     */
    public function updatePaymentMethod(
        PaymentMethodRequest $request,
        PaymentMethod $paymentMethod
    ): JsonResponse {
        // Track changes for audit log
        $changes = [];
        $originalData = $paymentMethod->getOriginal();

        // Update allowed fields
        $fillableFields = ['description', 'processing_fee', 'display_order', 'configuration'];

        foreach ($fillableFields as $field) {
            if ($request->has($field)) {
                $oldValue = $paymentMethod->{$field};
                $newValue = $request->input($field);

                if ($field === 'configuration') {
                    // Compare arrays properly (json encode is a simple way)
                    if (json_encode($oldValue) !== json_encode($newValue)) {
                        $changes[$field] = [
                            'old' => $oldValue,
                            'new' => $newValue,
                        ];
                        $paymentMethod->{$field} = $newValue;
                    }
                } elseif ($oldValue != $newValue) {
                    $changes[$field] = [
                        'old' => $oldValue,
                        'new' => $newValue,
                    ];
                    $paymentMethod->{$field} = $newValue;
                }
            }
        }

        if (!empty($changes)) {
            $paymentMethod->save();
            $paymentMethod->logUpdate($changes);
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment method updated successfully',
            'data' => [
                'id' => $paymentMethod->id,
                'name' => $paymentMethod->name,
                'code' => $paymentMethod->code,
                'type' => $paymentMethod->type,
                'description' => $paymentMethod->description,
                'processing_fee' => (float) $paymentMethod->processing_fee,
                'display_order' => $paymentMethod->display_order,
                'configuration' => $paymentMethod->configuration,
                'is_active' => $paymentMethod->is_active,
                'can_be_disabled' => $paymentMethod->canBeDisabled(),
            ],
        ]);
    }

    /**
     * Toggle payment method active status.
     * 
     * POST /api/admin/payment-methods/{id}/toggle
     */
    public function togglePaymentMethod(PaymentMethod $paymentMethod): JsonResponse
    {
        if (!$paymentMethod->canBeDisabled() && $paymentMethod->is_active) {
            $reason = $paymentMethod->code === 'cash'
                ? 'Cannot disable cash payment method (safety fallback)'
                : 'Cannot disable the last active payment method';

            return response()->json([
                'success' => false,
                'error' => $reason,
            ], 400);
        }

        $success = $paymentMethod->toggle();

        if (!$success) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to toggle payment method',
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => $paymentMethod->is_active
                ? 'Payment method enabled successfully'
                : 'Payment method disabled successfully',
            'data' => [
                'id' => $paymentMethod->id,
                'name' => $paymentMethod->name,
                'is_active' => $paymentMethod->is_active,
                'can_be_disabled' => $paymentMethod->canBeDisabled(),
            ],
        ]);
    }

    /**
     * Get audit log for a payment method.
     * 
     * GET /api/admin/payment-methods/{id}/audit-log
     */
    public function paymentMethodAuditLog(PaymentMethod $paymentMethod): JsonResponse
    {
        $logs = $paymentMethod->auditLogs()
            ->with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'changes' => $log->changes,
                    'user' => $log->user ? [
                        'id' => $log->user->id,
                        'name' => $log->user->name,
                        'email' => $log->user->email,
                    ] : null,
                    'ip_address' => $log->ip_address,
                    'created_at' => $log->created_at?->toIso8601String(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }
}


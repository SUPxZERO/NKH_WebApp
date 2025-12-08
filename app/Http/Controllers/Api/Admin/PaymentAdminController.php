<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\DailySettlement;
use App\Models\Payment;
use App\Models\PaymentAuditLog;
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

        return match($period) {
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
}

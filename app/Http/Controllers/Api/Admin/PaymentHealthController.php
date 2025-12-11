<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\PaymentMonitoringService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class PaymentHealthController extends Controller
{
    protected PaymentMonitoringService $monitoringService;

    public function __construct(PaymentMonitoringService $monitoringService)
    {
        $this->monitoringService = $monitoringService;
    }

    /**
     * Get payment system health status.
     * 
     * GET /api/admin/payments/health
     */
    public function status(): JsonResponse
    {
        $health = $this->monitoringService->getHealthStatus();

        // Add database connectivity check
        try {
            DB::connection()->getPdo();
            $health['database'] = 'connected';
        } catch (\Exception $e) {
            $health['database'] = 'disconnected';
            $health['status'] = 'critical';
        }

        // Add cache connectivity check
        try {
            Cache::put('health_check', true, 1);
            $health['cache'] = Cache::get('health_check') ? 'connected' : 'error';
        } catch (\Exception $e) {
            $health['cache'] = 'disconnected';
        }

        // Add Stripe connectivity check
        if (config('services.stripe.secret')) {
            $health['stripe'] = 'configured';
        } else {
            $health['stripe'] = 'not_configured';
        }

        return response()->json([
            'success' => true,
            'data' => $health,
        ]);
    }

    /**
     * Get payment metrics for monitoring dashboard.
     * 
     * GET /api/admin/payments/metrics
     */
    public function metrics(Request $request): JsonResponse
    {
        $hours = min(72, max(1, (int) $request->get('hours', 24)));
        
        $metrics = $this->monitoringService->getMetrics($hours);

        // Calculate summary
        $summary = [
            'total_initiated' => 0,
            'total_completed' => 0,
            'total_failed' => 0,
            'success_rate' => 0,
        ];

        foreach ($metrics as $hour) {
            $summary['total_initiated'] += $hour['initiated'];
            $summary['total_completed'] += $hour['completed'];
            $summary['total_failed'] += $hour['failed'];
        }

        if ($summary['total_initiated'] > 0) {
            $summary['success_rate'] = round(
                (($summary['total_initiated'] - $summary['total_failed']) / $summary['total_initiated']) * 100,
                2
            );
        }

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'hourly' => $metrics,
            ],
        ]);
    }

    /**
     * Run integrity check on recent payments.
     * 
     * GET /api/admin/payments/integrity-check
     */
    public function integrityCheck(Request $request): JsonResponse
    {
        $limit = min(100, max(10, (int) $request->get('limit', 50)));
        
        $payments = Payment::orderBy('created_at', 'desc')
            ->take($limit)
            ->get();

        $results = [
            'checked' => 0,
            'valid' => 0,
            'issues' => [],
        ];

        foreach ($payments as $payment) {
            $check = $this->monitoringService->verifyPaymentIntegrity($payment);
            $results['checked']++;
            
            if ($check['is_valid']) {
                $results['valid']++;
            } else {
                $results['issues'][] = [
                    'payment_id' => $payment->id,
                    'reference' => $payment->reference_number,
                    'problems' => $check['issues'],
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }

    /**
     * Get stuck/pending payments that may need attention.
     * 
     * GET /api/admin/payments/stuck
     */
    public function stuckPayments(Request $request): JsonResponse
    {
        $minutes = (int) $request->get('older_than_minutes', 30);
        
        $stuckPayments = Payment::where('status', Payment::STATUS_PENDING)
            ->where('created_at', '<', now()->subMinutes($minutes))
            ->with('paymentMethod', 'invoice.order')
            ->orderBy('created_at', 'asc')
            ->limit(50)
            ->get()
            ->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'reference' => $payment->reference_number,
                    'amount' => $payment->amount,
                    'method' => $payment->paymentMethod?->name,
                    'order_number' => $payment->invoice?->order?->order_number,
                    'created_at' => $payment->created_at->toIso8601String(),
                    'age_minutes' => $payment->created_at->diffInMinutes(now()),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'count' => $stuckPayments->count(),
                'payments' => $stuckPayments,
            ],
        ]);
    }

    /**
     * Get daily reconciliation summary.
     * 
     * GET /api/admin/payments/reconciliation
     */
    public function reconciliation(Request $request): JsonResponse
    {
        $date = $request->get('date', today()->format('Y-m-d'));
        $startOfDay = \Carbon\Carbon::parse($date)->startOfDay();
        $endOfDay = \Carbon\Carbon::parse($date)->endOfDay();

        // Get payment stats for the day
        $stats = Payment::whereBetween('created_at', [$startOfDay, $endOfDay])
            ->selectRaw('
                COUNT(*) as total_payments,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as cancelled,
                SUM(CASE WHEN status = ? THEN amount ELSE 0 END) as completed_amount
            ', [
                Payment::STATUS_COMPLETED,
                Payment::STATUS_PENDING,
                Payment::STATUS_FAILED,
                Payment::STATUS_CANCELLED,
                Payment::STATUS_COMPLETED,
            ])
            ->first();

        // Get by payment method
        $byMethod = Payment::whereBetween('created_at', [$startOfDay, $endOfDay])
            ->where('status', Payment::STATUS_COMPLETED)
            ->join('payment_methods', 'payments.payment_method_id', '=', 'payment_methods.id')
            ->groupBy('payment_methods.name', 'payment_methods.code')
            ->selectRaw('payment_methods.name, payment_methods.code, COUNT(*) as count, SUM(payments.amount) as total')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'date' => $date,
                'summary' => [
                    'total_payments' => (int) ($stats->total_payments ?? 0),
                    'completed' => (int) ($stats->completed ?? 0),
                    'pending' => (int) ($stats->pending ?? 0),
                    'failed' => (int) ($stats->failed ?? 0),
                    'cancelled' => (int) ($stats->cancelled ?? 0),
                    'completed_amount' => (float) ($stats->completed_amount ?? 0),
                ],
                'by_method' => $byMethod,
            ],
        ]);
    }
}

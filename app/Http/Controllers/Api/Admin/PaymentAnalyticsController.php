<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Refund;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentAnalyticsController extends Controller
{
    /**
     * Get comprehensive payment analytics.
     * 
     * GET /api/admin/payments/analytics
     */
    public function index(Request $request): JsonResponse
    {
        $period = $request->get('period', '30d'); // 7d, 30d, 90d, 12m, ytd, all
        [$startDate, $endDate] = $this->parsePeriod($period);

        // Get previous period for comparison
        $periodDays = $startDate->diffInDays($endDate);
        $prevStartDate = $startDate->copy()->subDays($periodDays);
        $prevEndDate = $startDate->copy()->subDay();

        // Current period stats
        $currentStats = $this->getPeriodStats($startDate, $endDate);
        $prevStats = $this->getPeriodStats($prevStartDate, $prevEndDate);

        // Calculate growth rates
        $growth = [
            'revenue' => $this->calculateGrowth($prevStats['revenue'], $currentStats['revenue']),
            'transactions' => $this->calculateGrowth($prevStats['completed'], $currentStats['completed']),
            'avg_order' => $this->calculateGrowth($prevStats['avg_order'], $currentStats['avg_order']),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'period' => [
                    'start' => $startDate->toDateString(),
                    'end' => $endDate->toDateString(),
                    'days' => $periodDays,
                ],
                'summary' => $currentStats,
                'growth' => $growth,
                'previous_period' => $prevStats,
            ],
        ]);
    }

    /**
     * Get revenue analytics with trends.
     * 
     * GET /api/admin/payments/analytics/revenue
     */
    public function revenue(Request $request): JsonResponse
    {
        $period = $request->get('period', '30d');
        $groupBy = $request->get('group_by', 'day'); // day, week, month
        [$startDate, $endDate] = $this->parsePeriod($period);

        $dateFormat = match ($groupBy) {
            'week' => '%Y-%W',
            'month' => '%Y-%m',
            default => '%Y-%m-%d',
        };

        $revenue = Payment::where('status', Payment::STATUS_COMPLETED)
            ->whereBetween('completed_at', [$startDate, $endDate])
            ->selectRaw("DATE_FORMAT(completed_at, '{$dateFormat}') as period, SUM(amount) as total, COUNT(*) as count")
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        // Fill in missing dates
        $filledData = $this->fillDateGaps($revenue, $startDate, $endDate, $groupBy);

        // Calculate cumulative revenue
        $cumulative = 0;
        $dataWithCumulative = $filledData->map(function ($item) use (&$cumulative) {
            $cumulative += $item['total'];
            $item['cumulative'] = $cumulative;
            return $item;
        });

        return response()->json([
            'success' => true,
            'data' => [
                'period' => ['start' => $startDate->toDateString(), 'end' => $endDate->toDateString()],
                'group_by' => $groupBy,
                'total_revenue' => $cumulative,
                'data' => $dataWithCumulative,
            ],
        ]);
    }

    /**
     * Get payment method breakdown.
     * 
     * GET /api/admin/payments/analytics/methods
     */
    public function methods(Request $request): JsonResponse
    {
        $period = $request->get('period', '30d');
        [$startDate, $endDate] = $this->parsePeriod($period);

        $breakdown = Payment::where('status', Payment::STATUS_COMPLETED)
            ->whereBetween('completed_at', [$startDate, $endDate])
            ->join('payment_methods', 'payments.payment_method_id', '=', 'payment_methods.id')
            ->selectRaw('
                payment_methods.name,
                payment_methods.code,
                COUNT(*) as transaction_count,
                SUM(payments.amount) as total_amount,
                AVG(payments.amount) as avg_amount
            ')
            ->groupBy('payment_methods.id', 'payment_methods.name', 'payment_methods.code')
            ->orderByDesc('total_amount')
            ->get();

        $totalAmount = $breakdown->sum('total_amount');
        $totalCount = $breakdown->sum('transaction_count');

        $breakdownWithPercentages = $breakdown->map(function ($item) use ($totalAmount, $totalCount) {
            return [
                'method' => $item->name,
                'code' => $item->code,
                'transaction_count' => (int) $item->transaction_count,
                'total_amount' => (float) $item->total_amount,
                'avg_amount' => round((float) $item->avg_amount, 2),
                'percentage_amount' => $totalAmount > 0 ? round(($item->total_amount / $totalAmount) * 100, 1) : 0,
                'percentage_count' => $totalCount > 0 ? round(($item->transaction_count / $totalCount) * 100, 1) : 0,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'period' => ['start' => $startDate->toDateString(), 'end' => $endDate->toDateString()],
                'total_amount' => (float) $totalAmount,
                'total_transactions' => (int) $totalCount,
                'breakdown' => $breakdownWithPercentages,
            ],
        ]);
    }

    /**
     * Get success/failure rate analytics.
     * 
     * GET /api/admin/payments/analytics/success-rate
     */
    public function successRate(Request $request): JsonResponse
    {
        $period = $request->get('period', '30d');
        $groupBy = $request->get('group_by', 'day');
        [$startDate, $endDate] = $this->parsePeriod($period);

        $dateFormat = match ($groupBy) {
            'week' => '%Y-%W',
            'month' => '%Y-%m',
            default => '%Y-%m-%d',
        };

        $rates = Payment::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw("
                DATE_FORMAT(created_at, '{$dateFormat}') as period,
                COUNT(*) as total,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as cancelled
            ", [Payment::STATUS_COMPLETED, Payment::STATUS_FAILED, Payment::STATUS_CANCELLED])
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(function ($item) {
                return [
                    'period' => $item->period,
                    'total' => (int) $item->total,
                    'completed' => (int) $item->completed,
                    'failed' => (int) $item->failed,
                    'cancelled' => (int) $item->cancelled,
                    'success_rate' => $item->total > 0 ? round(($item->completed / $item->total) * 100, 1) : 0,
                    'failure_rate' => $item->total > 0 ? round(($item->failed / $item->total) * 100, 1) : 0,
                ];
            });

        // Overall rates
        $totals = [
            'total' => $rates->sum('total'),
            'completed' => $rates->sum('completed'),
            'failed' => $rates->sum('failed'),
            'cancelled' => $rates->sum('cancelled'),
        ];
        $totals['success_rate'] = $totals['total'] > 0 ? round(($totals['completed'] / $totals['total']) * 100, 1) : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'period' => ['start' => $startDate->toDateString(), 'end' => $endDate->toDateString()],
                'group_by' => $groupBy,
                'summary' => $totals,
                'data' => $rates,
            ],
        ]);
    }

    /**
     * Get peak hours/days analysis.
     * 
     * GET /api/admin/payments/analytics/peaks
     */
    public function peaks(Request $request): JsonResponse
    {
        $period = $request->get('period', '30d');
        [$startDate, $endDate] = $this->parsePeriod($period);

        // Hourly distribution
        $hourly = Payment::where('status', Payment::STATUS_COMPLETED)
            ->whereBetween('completed_at', [$startDate, $endDate])
            ->selectRaw('HOUR(completed_at) as hour, COUNT(*) as count, SUM(amount) as amount')
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->keyBy('hour');

        // Fill all 24 hours
        $hourlyData = collect(range(0, 23))->map(function ($hour) use ($hourly) {
            $data = $hourly->get($hour);
            return [
                'hour' => $hour,
                'label' => sprintf('%02d:00', $hour),
                'count' => (int) ($data?->count ?? 0),
                'amount' => (float) ($data?->amount ?? 0),
            ];
        });

        // Day of week distribution
        $daily = Payment::where('status', Payment::STATUS_COMPLETED)
            ->whereBetween('completed_at', [$startDate, $endDate])
            ->selectRaw('DAYOFWEEK(completed_at) as day, COUNT(*) as count, SUM(amount) as amount')
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->keyBy('day');

        $dayNames = ['', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        $dailyData = collect(range(1, 7))->map(function ($day) use ($daily, $dayNames) {
            $data = $daily->get($day);
            return [
                'day' => $day,
                'label' => $dayNames[$day],
                'count' => (int) ($data?->count ?? 0),
                'amount' => (float) ($data?->amount ?? 0),
            ];
        });

        // Find peaks
        $peakHour = $hourlyData->sortByDesc('amount')->first();
        $peakDay = $dailyData->sortByDesc('amount')->first();

        return response()->json([
            'success' => true,
            'data' => [
                'period' => ['start' => $startDate->toDateString(), 'end' => $endDate->toDateString()],
                'hourly' => $hourlyData->values(),
                'daily' => $dailyData->values(),
                'peaks' => [
                    'hour' => $peakHour,
                    'day' => $peakDay,
                ],
            ],
        ]);
    }

    /**
     * Get refund analytics.
     * 
     * GET /api/admin/payments/analytics/refunds
     */
    public function refunds(Request $request): JsonResponse
    {
        $period = $request->get('period', '30d');
        [$startDate, $endDate] = $this->parsePeriod($period);

        // Refund stats
        $refundStats = Refund::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('
                COUNT(*) as total_refunds,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as rejected,
                SUM(amount) as total_amount,
                SUM(CASE WHEN status = ? THEN amount ELSE 0 END) as completed_amount
            ', ['completed', 'pending', 'rejected', 'completed'])
            ->first();

        // Get payment revenue for refund rate calculation
        $paymentRevenue = Payment::where('status', Payment::STATUS_COMPLETED)
            ->whereBetween('completed_at', [$startDate, $endDate])
            ->sum('amount');

        $refundRate = $paymentRevenue > 0 
            ? round((($refundStats->completed_amount ?? 0) / $paymentRevenue) * 100, 2)
            : 0;

        // Top refund reasons
        $reasons = Refund::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('reason, COUNT(*) as count, SUM(amount) as total')
            ->groupBy('reason')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'period' => ['start' => $startDate->toDateString(), 'end' => $endDate->toDateString()],
                'summary' => [
                    'total_refunds' => (int) ($refundStats->total_refunds ?? 0),
                    'completed' => (int) ($refundStats->completed ?? 0),
                    'pending' => (int) ($refundStats->pending ?? 0),
                    'rejected' => (int) ($refundStats->rejected ?? 0),
                    'total_amount' => (float) ($refundStats->total_amount ?? 0),
                    'completed_amount' => (float) ($refundStats->completed_amount ?? 0),
                    'refund_rate' => $refundRate,
                ],
                'reasons' => $reasons,
            ],
        ]);
    }

    /**
     * Get top customers by payment volume.
     * 
     * GET /api/admin/payments/analytics/top-customers
     */
    public function topCustomers(Request $request): JsonResponse
    {
        $period = $request->get('period', '30d');
        $limit = min(50, max(5, (int) $request->get('limit', 10)));
        [$startDate, $endDate] = $this->parsePeriod($period);

        $topCustomers = Payment::where('payments.status', Payment::STATUS_COMPLETED)
            ->whereBetween('payments.completed_at', [$startDate, $endDate])
            ->join('invoices', 'payments.invoice_id', '=', 'invoices.id')
            ->join('orders', 'invoices.order_id', '=', 'orders.id')
            ->join('customers', 'orders.customer_id', '=', 'customers.id')
            ->join('users', 'customers.user_id', '=', 'users.id')
            ->selectRaw('
                customers.id as customer_id,
                users.first_name,
                users.last_name,
                users.email,
                COUNT(DISTINCT payments.id) as transaction_count,
                SUM(payments.amount) as total_spent,
                AVG(payments.amount) as avg_order
            ')
            ->groupBy('customers.id', 'users.first_name', 'users.last_name', 'users.email')
            ->orderByDesc('total_spent')
            ->limit($limit)
            ->get()
            ->map(function ($customer) {
                return [
                    'customer_id' => $customer->customer_id,
                    'name' => trim($customer->first_name . ' ' . $customer->last_name),
                    'email' => $customer->email,
                    'transaction_count' => (int) $customer->transaction_count,
                    'total_spent' => (float) $customer->total_spent,
                    'avg_order' => round((float) $customer->avg_order, 2),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'period' => ['start' => $startDate->toDateString(), 'end' => $endDate->toDateString()],
                'customers' => $topCustomers,
            ],
        ]);
    }

    /**
     * Generate and download a financial report.
     * 
     * GET /api/admin/payments/analytics/report
     */
    public function report(Request $request): JsonResponse
    {
        $period = $request->get('period', '30d');
        $format = $request->get('format', 'json');
        [$startDate, $endDate] = $this->parsePeriod($period);

        // Compile comprehensive report
        $report = [
            'generated_at' => now()->toIso8601String(),
            'period' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
                'days' => $startDate->diffInDays($endDate),
            ],
            'summary' => $this->getPeriodStats($startDate, $endDate),
            'by_method' => Payment::where('status', Payment::STATUS_COMPLETED)
                ->whereBetween('completed_at', [$startDate, $endDate])
                ->join('payment_methods', 'payments.payment_method_id', '=', 'payment_methods.id')
                ->selectRaw('payment_methods.name, COUNT(*) as count, SUM(payments.amount) as total')
                ->groupBy('payment_methods.name')
                ->get(),
            'by_status' => Payment::whereBetween('created_at', [$startDate, $endDate])
                ->selectRaw('status, COUNT(*) as count, SUM(amount) as total')
                ->groupBy('status')
                ->get(),
            'refunds' => [
                'count' => Refund::whereBetween('created_at', [$startDate, $endDate])
                    ->where('status', 'completed')
                    ->count(),
                'amount' => Refund::whereBetween('created_at', [$startDate, $endDate])
                    ->where('status', 'completed')
                    ->sum('amount'),
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $report,
        ]);
    }

    // ==================== HELPERS ====================

    /**
     * Parse period string to date range.
     */
    protected function parsePeriod(string $period): array
    {
        $endDate = now()->endOfDay();

        return match (true) {
            $period === '7d' => [now()->subDays(6)->startOfDay(), $endDate],
            $period === '30d' => [now()->subDays(29)->startOfDay(), $endDate],
            $period === '90d' => [now()->subDays(89)->startOfDay(), $endDate],
            $period === '12m' => [now()->subMonths(12)->startOfDay(), $endDate],
            $period === 'ytd' => [now()->startOfYear(), $endDate],
            $period === 'all' => [Carbon::parse('2020-01-01'), $endDate],
            preg_match('/^\d{4}-\d{2}-\d{2}:\d{4}-\d{2}-\d{2}$/', $period) => [
                Carbon::parse(explode(':', $period)[0])->startOfDay(),
                Carbon::parse(explode(':', $period)[1])->endOfDay(),
            ],
            default => [now()->subDays(29)->startOfDay(), $endDate],
        };
    }

    /**
     * Get statistics for a period.
     */
    protected function getPeriodStats(Carbon $startDate, Carbon $endDate): array
    {
        $payments = Payment::whereBetween('created_at', [$startDate, $endDate]);
        
        $stats = $payments->selectRaw('
            COUNT(*) as total,
            SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as failed,
            SUM(CASE WHEN status = ? THEN amount ELSE 0 END) as revenue,
            AVG(CASE WHEN status = ? THEN amount ELSE NULL END) as avg_order
        ', [
            Payment::STATUS_COMPLETED,
            Payment::STATUS_FAILED,
            Payment::STATUS_COMPLETED,
            Payment::STATUS_COMPLETED,
        ])->first();

        return [
            'total_payments' => (int) ($stats->total ?? 0),
            'completed' => (int) ($stats->completed ?? 0),
            'failed' => (int) ($stats->failed ?? 0),
            'revenue' => (float) ($stats->revenue ?? 0),
            'avg_order' => round((float) ($stats->avg_order ?? 0), 2),
            'success_rate' => $stats->total > 0
                ? round(($stats->completed / $stats->total) * 100, 1)
                : 0,
        ];
    }

    /**
     * Calculate percentage growth.
     */
    protected function calculateGrowth($previous, $current): float
    {
        if ($previous == 0) {
            return $current > 0 ? 100 : 0;
        }
        return round((($current - $previous) / $previous) * 100, 1);
    }

    /**
     * Fill date gaps in results.
     */
    protected function fillDateGaps($data, Carbon $startDate, Carbon $endDate, string $groupBy): \Illuminate\Support\Collection
    {
        $dataByPeriod = $data->keyBy('period');
        
        $interval = match ($groupBy) {
            'week' => '1 week',
            'month' => '1 month',
            default => '1 day',
        };

        $periods = CarbonPeriod::create($startDate, $interval, $endDate);
        $result = collect();

        foreach ($periods as $date) {
            $periodKey = match ($groupBy) {
                'week' => $date->format('Y-W'),
                'month' => $date->format('Y-m'),
                default => $date->format('Y-m-d'),
            };

            $existing = $dataByPeriod->get($periodKey);
            
            $result->push([
                'period' => $periodKey,
                'date' => $date->format('Y-m-d'),
                'total' => (float) ($existing?->total ?? 0),
                'count' => (int) ($existing?->count ?? 0),
            ]);
        }

        return $result;
    }
}

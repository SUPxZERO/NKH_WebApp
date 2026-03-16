<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Customer;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    /**
     * Get sales trends over a specific date range.
     * Aggregates by day or month depending on the range span.
     */
    public function getSalesTrends(string $startDate, string $endDate, ?int $locationId = null): array
    {
        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();
        $diffInDays = $start->diffInDays($end);

        $groupByFormat = $diffInDays > 60 ? '%Y-%m' : '%Y-%m-%d';

        $query = Order::query()
            ->whereIn('status', ['completed', 'delivered'])
            ->whereBetween('created_at', [$start, $end]);

        if ($locationId) {
            $query->where('location_id', $locationId);
        }

        $trends = $query->select(
            DB::raw("DATE_FORMAT(created_at, '{$groupByFormat}') as date"),
            DB::raw('SUM(total_amount) as total_revenue'),
            DB::raw('COUNT(id) as order_count'),
            DB::raw('AVG(total_amount) as average_order_value')
        )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return [
            'summary' => [
                'total_revenue' => $trends->sum('total_revenue'),
                'total_orders' => $trends->sum('order_count'),
                'average_order_value' => $trends->avg('average_order_value'),
            ],
            'chart_data' => $trends
        ];
    }

    /**
     * Get top selling products.
     */
    public function getTopProducts(int $limit = 10, ?string $startDate = null, ?string $endDate = null, ?int $locationId = null): array
    {
        $query = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('menu_items', 'menu_items.id', '=', 'order_items.menu_item_id')
            ->select(
                'menu_items.name',
                'menu_items.id',
                DB::raw('SUM(order_items.quantity) as total_quantity_sold'),
                DB::raw('SUM(order_items.total_price) as total_revenue_generated')
            )
            ->whereIn('orders.status', ['completed', 'delivered']);

        if ($startDate && $endDate) {
            $query->whereBetween('orders.created_at', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay()
            ]);
        }

        if ($locationId) {
            $query->where('orders.location_id', $locationId);
        }

        return $query->groupBy('menu_items.id', 'menu_items.name')
            ->orderByDesc('total_revenue_generated')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    /**
     * Get customer insights including CLV and churn risk metrics.
     */
    public function getCustomerInsights(?string $startDate = null, ?string $endDate = null, ?int $locationId = null): array
    {
        // For general customers query, we find top spenders
        $query = Customer::query()
            ->with('user')
            ->withCount([
                'orders' => function ($q) use ($locationId) {
                    $q->whereIn('status', ['completed', 'delivered']);
                    if ($locationId) {
                        $q->where('location_id', $locationId);
                    }
                }
            ])
            ->withSum([
                'orders as total_spent' => function ($q) use ($locationId) {
                    $q->whereIn('status', ['completed', 'delivered']);
                    if ($locationId) {
                        $q->where('location_id', $locationId);
                    }
                }
            ], 'total_amount');

        $topCustomers = $query->orderByDesc('total_spent')->limit(10)->get();

        // Calculate Churn Risk (High spenders who haven't ordered in 60 days)
        $churnRiskCutoff = now()->subDays(60);
        $atRiskCustomers = Customer::query()
            ->with('user')
            ->whereHas('orders', function ($q) use ($locationId) {
                $q->whereIn('status', ['completed', 'delivered']);
                if ($locationId) {
                    $q->where('location_id', $locationId);
                }
            }, '>=', 3) // At least 3 orders historically
            ->whereDoesntHave('orders', function ($q) use ($churnRiskCutoff, $locationId) {
                $q->where('created_at', '>=', $churnRiskCutoff);
                if ($locationId) {
                    $q->where('location_id', $locationId);
                }
            })
            ->withSum([
                'orders as total_spent' => function ($q) use ($locationId) {
                    $q->whereIn('status', ['completed', 'delivered']);
                    if ($locationId) {
                        $q->where('location_id', $locationId);
                    }
                }
            ], 'total_amount')
            ->orderByDesc('total_spent')
            ->limit(10)
            ->get();

        return [
            'top_customers' => $topCustomers,
            'at_risk_customers' => $atRiskCustomers,
            'total_active_customers' => Customer::whereHas('orders', function ($q) use ($churnRiskCutoff) {
                $q->where('created_at', '>=', $churnRiskCutoff);
            })->count()
        ];
    }
}

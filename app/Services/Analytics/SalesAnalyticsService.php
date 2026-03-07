<?php

declare(strict_types=1);

namespace App\Services\Analytics;

use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * SalesAnalyticsService
 *
 * AUDIT FIX: Extracted from AnalyticsController (846 lines → thin controller).
 * Centralizes all sales data aggregation logic so it can be:
 *  - Unit tested independently from HTTP concerns
 *  - Reused across controllers, scheduled commands, and report exports
 *  - Extended with caching (Redis) without touching controllers
 *
 * All methods accept a $dates array ['start' => Carbon, 'end' => Carbon]
 * which should be built by getDateRangeFromRequest() or getDateRange().
 */
class SalesAnalyticsService
{
    /**
     * Build a date range array from start/end date strings or a preset range key.
     */
    public function getDateRangeFromRequest(\Illuminate\Http\Request $request): array
    {
        if ($request->has('start_date') && $request->has('end_date')) {
            return [
                'start' => Carbon::parse($request->start_date)->startOfDay(),
                'end' => Carbon::parse($request->end_date)->endOfDay(),
            ];
        }

        return $this->getDateRange($request->get('range', '7days'));
    }

    /**
     * Build a date range from a preset key.
     */
    public function getDateRange(string $range): array
    {
        $end = Carbon::now();

        $start = match ($range) {
            'today' => Carbon::today(),
            '7days' => Carbon::now()->subDays(7),
            '30days' => Carbon::now()->subDays(30),
            '90days' => Carbon::now()->subDays(90),
            'year' => Carbon::now()->subYear(),
            default => Carbon::now()->subDays(7),
        };

        return ['start' => $start, 'end' => $end];
    }

    /**
     * High-level sales overview: revenue, orders, customers.
     */
    public function getSalesData(array $dates): array
    {
        $locationId = request()->user()?->getActiveBranchId();

        $stats = Order::whereBetween('created_at', [$dates['start'], $dates['end']])
            ->when($locationId, fn($q) => $q->where('location_id', $locationId))
            ->whereDoesntHave('orderStatus', fn($q) => $q->where('code', 'cancelled'))
            ->select([
                DB::raw('COUNT(*) as total_orders'),
                DB::raw('SUM(total_amount) as total_revenue'),
                DB::raw('AVG(total_amount) as avg_order_value'),
                DB::raw('COUNT(DISTINCT customer_id) as unique_customers'),
            ])
            ->first();

        $data = $stats ? $stats->toArray() : [];

        return [
            'total_revenue' => (float) ($data['total_revenue'] ?? 0),
            'avg_order_value' => (float) ($data['avg_order_value'] ?? 0),
            'total_orders' => (int) ($data['total_orders'] ?? 0),
            'unique_customers' => (int) ($data['unique_customers'] ?? 0),
        ];
    }

    /**
     * Revenue and order count over time, auto-grouped by day or month.
     */
    public function getTrendsData(array $dates): array
    {
        $daysDiff = $dates['start']->diffInDays($dates['end']);
        $driver = DB::connection()->getDriverName();
        $isSqlite = $driver === 'sqlite';

        if ($daysDiff > 60) {
            $groupBy = $isSqlite ? "strftime('%Y-%m', created_at)" : "DATE_FORMAT(created_at, '%Y-%m')";
        } else {
            $groupBy = $isSqlite ? "date(created_at)" : "DATE(created_at)";
        }

        $locationId = request()->user()?->getActiveBranchId();

        return Order::whereBetween('created_at', [$dates['start'], $dates['end']])
            ->when($locationId, fn($q) => $q->where('location_id', $locationId))
            ->whereDoesntHave('orderStatus', fn($q) => $q->where('code', 'cancelled'))
            ->select([
                DB::raw($groupBy . ' as date'),
                DB::raw('COUNT(*) as orders'),
                DB::raw('SUM(total_amount) as revenue'),
            ])
            ->groupBy(DB::raw($groupBy))
            ->orderBy('date')
            ->get()
            ->map(fn($item) => [
                'date' => $item->date,
                'orders' => (int) $item->orders,
                'revenue' => (float) $item->revenue,
            ])
            ->toArray();
    }

    /**
     * Top 10 selling menu items by quantity.
     */
    public function getTopItemsData(array $dates): array
    {
        $locationId = request()->user()?->getActiveBranchId();

        return DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->join('menu_item_translations', function ($join) {
                $join->on('menu_items.id', '=', 'menu_item_translations.menu_item_id')
                    ->where('menu_item_translations.locale', '=', app()->getLocale());
            })
            ->leftJoin('order_statuses', 'orders.order_status_id', '=', 'order_statuses.id')
            ->whereBetween('orders.created_at', [$dates['start'], $dates['end']])
            ->when($locationId, fn($q) => $q->where('orders.location_id', $locationId))
            ->where(fn($q) => $q->where('order_statuses.code', '!=', 'cancelled')
                ->orWhereNull('order_statuses.code'))
            ->select([
                'menu_items.id',
                'menu_item_translations.name',
                DB::raw('SUM(order_items.quantity) as quantity_sold'),
                DB::raw('SUM(order_items.total_price) as revenue'),
            ])
            ->groupBy('menu_items.id', 'menu_item_translations.name')
            ->orderByDesc('quantity_sold')
            ->limit(10)
            ->get()
            ->map(fn($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'quantity_sold' => (int) ($item->quantity_sold ?? 0),
                'revenue' => (float) ($item->revenue ?? 0),
            ])
            ->toArray();
    }

    /**
     * Revenue breakdown by menu category.
     */
    public function getCategoryData(array $dates): array
    {
        $locationId = request()->user()?->getActiveBranchId();

        return DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->leftJoin('categories', 'menu_items.category_id', '=', 'categories.id')
            ->leftJoin('category_translations', function ($join) {
                $join->on('categories.id', '=', 'category_translations.category_id')
                    ->where('category_translations.locale', '=', app()->getLocale());
            })
            ->leftJoin('order_statuses', 'orders.order_status_id', '=', 'order_statuses.id')
            ->whereBetween('orders.created_at', [$dates['start'], $dates['end']])
            ->when($locationId, fn($q) => $q->where('orders.location_id', $locationId))
            ->where(fn($q) => $q->where('order_statuses.code', '!=', 'cancelled')
                ->orWhereNull('order_statuses.code'))
            ->select([
                DB::raw("COALESCE(category_translations.name, categories.slug, 'Uncategorized') as name"),
                DB::raw('SUM(order_items.total_price) as value'),
            ])
            ->groupBy('name')
            ->get()
            ->map(fn($item) => ($val = (float) ($item->value ?? 0)) > 0
                ? ['name' => $item->name, 'value' => $val]
                : null)
            ->filter()
            ->values()
            ->toArray();
    }

    /**
     * Orders and revenue by hour of day.
     */
    public function getPeakHoursData(array $dates): array
    {
        $driver = DB::connection()->getDriverName();
        $hourSql = $driver === 'sqlite'
            ? "CAST(strftime('%H', created_at) AS INTEGER)"
            : "HOUR(created_at)";
        $locationId = request()->user()?->getActiveBranchId();

        return Order::whereBetween('created_at', [$dates['start'], $dates['end']])
            ->when($locationId, fn($q) => $q->where('location_id', $locationId))
            ->whereDoesntHave('orderStatus', fn($q) => $q->where('code', 'cancelled'))
            ->select([
                DB::raw("$hourSql as hour"),
                DB::raw('COUNT(*) as orders'),
                DB::raw('SUM(total_amount) as revenue'),
            ])
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->map(fn($item) => [
                'hour' => sprintf('%02d:00', (int) $item->hour),
                'orders' => (int) $item->orders,
                'revenue' => (float) $item->revenue,
            ])
            ->toArray();
    }

    /**
     * Revenue breakdown by payment method.
     */
    public function getSalesByPaymentMethod(array $dates): array
    {
        $locationId = request()->user()?->getActiveBranchId();

        return Order::whereBetween('created_at', [$dates['start'], $dates['end']])
            ->when($locationId, fn($q) => $q->where('location_id', $locationId))
            ->whereDoesntHave('orderStatus', fn($q) => $q->where('code', 'cancelled'))
            ->select([
                'payment_mode',
                DB::raw('COUNT(*) as orders'),
                DB::raw('SUM(total_amount) as revenue'),
            ])
            ->groupBy('payment_mode')
            ->get()
            ->map(fn($item) => [
                'payment_method' => $item->payment_mode ?? 'Unknown',
                'orders' => (int) $item->orders,
                'revenue' => (float) $item->revenue,
            ])
            ->toArray();
    }

    /**
     * Customer acquisition and retention metrics.
     */
    public function getCustomerMetrics(array $dates): array
    {
        $locationId = request()->user()?->getActiveBranchId();

        return [
            'new_customers' => Order::whereBetween('created_at', [$dates['start'], $dates['end']])
                ->when($locationId, fn($q) => $q->where('location_id', $locationId))
                ->distinct('customer_id')
                ->whereNotNull('customer_id')
                ->count(),
            'returning_customers' => DB::table('orders as o1')
                ->join('orders as o2', 'o1.customer_id', '=', 'o2.customer_id')
                ->whereBetween('o1.created_at', [$dates['start'], $dates['end']])
                ->where('o2.created_at', '<', $dates['start'])
                ->when($locationId, fn($q) => $q->where('o1.location_id', $locationId)->where('o2.location_id', $locationId))
                ->distinct('o1.customer_id')
                ->count(),
            'avg_orders_per_customer' => (float) Order::whereBetween('created_at', [$dates['start'], $dates['end']])
                ->when($locationId, fn($q) => $q->where('location_id', $locationId))
                ->whereNotNull('customer_id')
                ->select('customer_id', DB::raw('COUNT(*) as order_count'))
                ->groupBy('customer_id')
                ->get()
                ->avg('order_count'),
        ];
    }

    /**
     * Single-day summary: totals, averages, min/max.
     */
    public function getDailySummary(string $date): array
    {
        $locationId = request()->user()?->getActiveBranchId();

        $summary = Order::whereDate('created_at', $date)
            ->when($locationId, fn($q) => $q->where('location_id', $locationId))
            ->whereDoesntHave('orderStatus', fn($q) => $q->where('code', 'cancelled'))
            ->select([
                DB::raw('COUNT(*) as total_orders'),
                DB::raw('SUM(total_amount) as total_revenue'),
                DB::raw('AVG(total_amount) as avg_order_value'),
                DB::raw('MIN(total_amount) as min_order'),
                DB::raw('MAX(total_amount) as max_order'),
            ])
            ->first();

        $data = $summary ? $summary->toArray() : [];

        return [
            'total_orders' => (int) ($data['total_orders'] ?? 0),
            'total_revenue' => (float) ($data['total_revenue'] ?? 0),
            'avg_order_value' => (float) ($data['avg_order_value'] ?? 0),
            'min_order' => (float) ($data['min_order'] ?? 0),
            'max_order' => (float) ($data['max_order'] ?? 0),
        ];
    }
}

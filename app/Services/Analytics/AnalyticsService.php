<?php

namespace App\Services\Analytics;

use App\Models\Order;
use App\Models\Payment;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsService
{
    /**
     * Get daily revenue for a given date range.
     */
    public function getDailyRevenue($startDate, $endDate)
    {
        return Payment::whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('payment_status_id')
            ->whereHas('paymentStatus', function($q) {
                // Assuming 'completed' or 'is_successful' flag. 
                // For now relying on the seeded is_successful flag if possible, 
                // or just status='completed' fallback if we trust the new lookup table.
                $q->where('is_successful', true);
            })
            ->selectRaw('DATE(created_at) as date, SUM(amount) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get();
    }

    /**
     * Get orders count grouped by status.
     */
    public function getOrderStatusCounts($startDate, $endDate)
    {
        return Order::whereBetween('created_at', [$startDate, $endDate])
            ->select('order_status_id', DB::raw('count(*) as count'))
            ->groupBy('order_status_id')
            ->with('orderStatus')
            ->get()
            ->map(function ($item) {
                return [
                    'status' => $item->orderStatus->name ?? 'Unknown',
                    'color' => $item->orderStatus->color ?? '#CCCCCC',
                    'count' => $item->count
                ];
            });
    }

    /**
     * Get top selling menu items.
     */
    public function getTopSellingItems($startDate, $endDate, $limit = 5)
    {
        return OrderItem::whereBetween('created_at', [$startDate, $endDate])
            ->select('menu_item_id', DB::raw('SUM(quantity) as total_quantity'), DB::raw('SUM(total_price) as total_revenue'))
            ->groupBy('menu_item_id')
            ->orderByDesc('total_quantity')
            ->limit($limit)
            ->with('menuItem')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->menuItem->name ?? 'Unknown Item',
                    'quantity' => $item->total_quantity,
                    'revenue' => $item->total_revenue
                ];
            });
    }

    /**
     * Get key performance indicators (KPIs).
     */
    public function getKPIs($startDate, $endDate)
    {
        $totalRevenue = Payment::whereBetween('created_at', [$startDate, $endDate])
            ->whereHas('paymentStatus', fn($q) => $q->where('is_successful', true))
            ->sum('amount');

        $totalOrders = Order::whereBetween('created_at', [$startDate, $endDate])->count();
        
        $avgOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;

        return [
            'total_revenue' => $totalRevenue,
            'total_orders' => $totalOrders,
            'avg_order_value' => $avgOrderValue,
        ];
    }
}

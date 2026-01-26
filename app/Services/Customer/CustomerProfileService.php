<?php

declare(strict_types=1);

namespace App\Services\Customer;

use App\Models\Customer;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Resources\CustomerResource;

class CustomerProfileService
{
    /**
     * Get aggregated customer statistics
     */
    public function getStats(Customer $customer): array
    {
        return [
            'total_orders' => $customer->orders()->count(),
            'total_spent' => $customer->total_spent ?? 0,
            'average_order_value' => $customer->average_order_value ?? 0,
            'visit_count' => $customer->visit_count ?? 0,
            'last_visit_date' => $customer->last_visit_date,
            'last_purchase_date' => $customer->last_purchase_date,
            'customer_tier' => $customer->customer_tier ?? 'bronze',
            'points_balance' => $customer->points_balance ?? 0,
            'no_show_count' => $customer->no_show_count ?? 0,
            'favorite_items' => $this->getFavoriteItems($customer),
            'preferred_location' => $customer->preferredLocation,
        ];
    }

    /**
     * Get top ordered items
     */
    private function getFavoriteItems(Customer $customer, int $limit = 5)
    {
        // Use eager loading principles to prevent N+1 issues later
        return DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->leftJoin('menu_item_translations', function ($join) {
                $join->on('menu_items.id', '=', 'menu_item_translations.menu_item_id')
                    ->where('menu_item_translations.locale', '=', app()->getLocale());
            })
            ->where('orders.customer_id', $customer->id)
            ->select(
                'menu_items.id',
                'menu_items.image_path',
                DB::raw('COALESCE(menu_item_translations.name, "Item #" || menu_items.id) as name'),
                DB::raw('COUNT(*) as order_count')
            )
            ->groupBy('menu_items.id', 'menu_items.image_path', 'name')
            ->orderByDesc('order_count')
            ->limit($limit)
            ->get();
    }

    /**
     * Get dashboard summary stats
     */
    public function getDashboardStats(Customer $customer): array
    {
        // 1. Orders metrics
        $currentMonthOrders = Order::where('customer_id', $customer->id)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $lastMonthOrders = Order::where('customer_id', $customer->id)
            ->whereMonth('created_at', now()->subMonth()->month)
            ->whereYear('created_at', now()->subMonth()->year)
            ->count();

        // improved trend calculation (percentage increase/decrease)
        $ordersTrend = 0;
        if ($lastMonthOrders > 0) {
            $ordersTrend = (($currentMonthOrders - $lastMonthOrders) / $lastMonthOrders) * 100;
        } else {
            $ordersTrend = $currentMonthOrders > 0 ? 100 : 0;
        }

        // 2. Points metrics
        $pointsEarnedThisMonth = $customer->loyaltyPoints()
            ->where('type', 'earned')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('points');

        // 3. Rewards metrics
        $pointsBalance = $customer->points_balance ?? 0;

        // Hardcoded rewards list to match RewardController
        $rewards = [
            ['points_required' => 100], // Free Appetizer
            ['points_required' => 200], // 20% Off
            ['points_required' => 150], // Free Delivery
            ['points_required' => 120], // Free Dessert
            ['points_required' => 50],  // Free Drink
            ['points_required' => 300], // 10% Off Next 5 Orders
            ['points_required' => 250], // VIP Table Reservation
            ['points_required' => 500], // Free Main Course
        ];

        $availableRewardsCount = 0;
        foreach ($rewards as $reward) {
            if ($pointsBalance >= $reward['points_required']) {
                $availableRewardsCount++;
            }
        }

        return [
            // Backend fields (kept for backward compatibility if needed)
            'points' => $customer->points_balance ?? 0,
            'tier' => $customer->customer_tier,
            'active_orders' => Order::where('customer_id', $customer->id)
                ->whereIn('status', ['pending', 'confirmed', 'preparing', 'ready'])
                ->count(),
            'total_orders' => $customer->orders()->count(),

            // Frontend expected fields (DashboardStats interface)
            'orders_this_month' => $currentMonthOrders,
            'orders_trend' => round($ordersTrend), // Round to integer for cleaner UI
            'points_earned_this_month' => (int) $pointsEarnedThisMonth,
            'available_rewards' => $availableRewardsCount,

            // Fix unread notifications safely
            'unread_notifications' => method_exists($customer, 'unreadNotifications')
                ? $customer->unreadNotifications()->count()
                : 0,
        ];
    }
}

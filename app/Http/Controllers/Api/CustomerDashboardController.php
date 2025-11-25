<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\LoyaltyPoint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CustomerDashboardController extends Controller
{
    /**
     * Get customer profile data
     */
    public function profile(Request $request)
    {
        $user = $request->user();
        
        // Get customer record
        $customer = Customer::with(['user', 'preferredLocation'])
            ->where('user_id', $user->id)
            ->first();

        if (!$customer) {
            return response()->json([
                'message' => 'Customer profile not found',
            ], 404);
        }

        // Calculate stats
        $totalOrders = Order::where('customer_id', $customer->id)->count();
        $totalSpent = Order::where('customer_id', $customer->id)
            ->whereIn('status', ['completed', 'delivered'])
            ->sum('total');

        // Get favorite items (most ordered items)
        $favoriteItems = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->join('menu_item_translations', function($join) {
                $join->on('menu_items.id', '=', 'menu_item_translations.menu_item_id')
                     ->where('menu_item_translations.locale', '=', app()->getLocale());
            })
            ->where('orders.customer_id', $customer->id)
            ->select('menu_item_translations.name', DB::raw('SUM(order_items.quantity) as total_ordered'))
            ->groupBy('menu_item_translations.name')
            ->orderByDesc('total_ordered')
            ->limit(5)
            ->pluck('name')
            ->toArray();

        // Points for next reward (every 100 points = 1 reward)
        $nextRewardPoints = 100 - ($customer->points_balance % 100);
        if ($customer->points_balance >= 100) {
            $nextRewardPoints = 100 - ($customer->points_balance % 100);
        }

        return response()->json([
            'data' => [
                'id' => $customer->id,
                'name' => $user->name,
                'email' => $user->email,
                'loyalty_points' => $customer->points_balance,
                'total_orders' => $totalOrders,
                'total_spent' => (float) $totalSpent,
                'favorite_items' => $favoriteItems,
                'member_since' => $customer->created_at->toISOString(),
                'next_reward_points' => 100, // Next milestone
            ],
        ]);
    }

    /**
     * Get dashboard statistics
     */
    public function dashboardStats(Request $request)
    {
        $user = $request->user();
        $customer = Customer::where('user_id', $user->id)->first();

        if (!$customer) {
            return response()->json(['data' => [
                'orders_this_month' => 0,
                'orders_trend' => 0,
                'points_earned_this_month' => 0,
                'available_rewards' => 0,
            ]]);
        }

        // Orders this month
        $ordersThisMonth = Order::where('customer_id', $customer->id)
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->count();

        // Orders last month for trend calculation
        $ordersLastMonth = Order::where('customer_id', $customer->id)
            ->whereYear('created_at', now()->subMonth()->year)
            ->whereMonth('created_at', now()->subMonth()->month)
            ->count();

        $ordersTrend = $ordersLastMonth > 0 
            ? (int) ((($ordersThisMonth - $ordersLastMonth) / $ordersLastMonth) * 100)
            : 0;

        // Points earned this month
        $pointsEarnedThisMonth = LoyaltyPoint::where('customer_id', $customer->id)
            ->where('type', 'earn')
            ->whereYear('occurred_at', now()->year)
            ->whereMonth('occurred_at', now()->month)
            ->sum('points');

        // Available rewards (every 100 points = 1 reward)
        $availableRewards = floor($customer->points_balance / 100);

        return response()->json([
            'data' => [
                'orders_this_month' => $ordersThisMonth,
                'orders_trend' => $ordersTrend,
                'points_earned_this_month' => (int) $pointsEarnedThisMonth,
                'available_rewards' => $availableRewards,
            ],
        ]);
    }

    /**
     * Get customer orders with optional limit
     */
    public function orders(Request $request)
    {
        $user = $request->user();
        $customer = Customer::where('user_id', $user->id)->first();

        if (!$customer) {
            return response()->json(['data' => []]);
        }

        $limit = $request->input('limit', 10);

        $orders = Order::where('customer_id', $customer->id)
            ->with(['items', 'location'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => $orders->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'type' => $order->type,
                    'status' => $order->status,
                    'preparation_status' => $order->preparation_status,
                    'total' => (float) $order->total,
                    'placed_at' => $order->placed_at,
                    'created_at' => $order->created_at->toISOString(),
                    'items_count' => $order->items->count(),
                ];
            }),
        ]);
    }

    /**
     * Get customer's favorite menu items
     */
    public function favorites(Request $request)
    {
        $user = $request->user();
        $customer = Customer::where('user_id', $user->id)->first();

        if (!$customer) {
            return response()->json(['data' => []]);
        }

        // Get most frequently ordered items
        $favorites = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->join('menu_item_translations', function($join) {
                $join->on('menu_items.id', '=', 'menu_item_translations.menu_item_id')
                     ->where('menu_item_translations.locale', '=', app()->getLocale());
            })
            ->where('orders.customer_id', $customer->id)
            ->select(
                'menu_items.id',
                'menu_items.slug',
                'menu_items.price',
                'menu_items.image_path',
                'menu_item_translations.name',
                DB::raw('SUM(order_items.quantity) as total_ordered'),
                DB::raw('MAX(orders.created_at) as last_ordered')
            )
            ->groupBy('menu_items.id', 'menu_items.slug', 'menu_items.price', 'menu_items.image_path', 'menu_item_translations.name')
            ->orderByDesc('total_ordered')
            ->limit(10)
            ->get();

        return response()->json(['data' => $favorites]);
    }
}

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
     * Get customer orders with pagination, filtering, and sorting
     */
    public function orders(Request $request)
    {
        // Handle both authenticated users and dev mode
        $customer = null;
        
        if ($request->user()) {
            $customer = Customer::where('user_id', $request->user()->id)->first();
        } else {
            // DEV MODE: Fallback to customer ID 1
            \Log::warning('CustomerDashboardController: No authenticated user, using fallback customer');
            $customer = Customer::find(1);
        }

        if (!$customer) {
            return response()->json([
                'status' => 'error',
                'message' => 'Customer profile not found',
                'data' => []
            ], 404);
        }

        // Build query with eager loading to prevent N+1
        $query = Order::where('customer_id', $customer->id)
            ->with([
                'items.menuItem.translations',
                'location',
                'timeSlot',
                'customerAddress',
                'invoice'
            ]);

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filter by approval_status
        if ($request->filled('approval_status')) {
            $query->where('approval_status', $request->input('approval_status'));
        }

        // Filter by order type
        if ($request->filled('order_type')) {
            $query->where('order_type', $request->input('order_type'));
        }

        // Filter by date range
        if ($request->filled('from_date')) {
            $query->whereDate('ordered_at', '>=', $request->input('from_date'));
        }
        if ($request->filled('to_date')) {
            $query->whereDate('ordered_at', '<=', $request->input('to_date'));
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'ordered_at');
        $sortOrder = $request->input('sort_order', 'desc');
        
        $allowedSorts = ['ordered_at', 'total_amount', 'status'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy('ordered_at', 'desc');
        }

        // Pagination
        $perPage = min(max((int) $request->input('per_page', 10), 1), 50);
        $orders = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $orders->map(function ($order) {
                // Get first item image for preview
                $previewImage = $order->items->first()?->menuItem?->image_path;

                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'order_type' => $order->order_type,
                    'status' => $order->status,
                    'approval_status' => $order->approval_status,
                    'payment_status' => $order->payment_status,
                    
                    // Amounts
                    'subtotal' => (float) $order->subtotal,
                    'tax_amount' => (float) ($order->tax_amount ?? 0),
                    'delivery_fee' => (float) ($order->delivery_fee ?? 0),
                    'discount_amount' => (float) ($order->discount_amount ?? 0),
                    'total_amount' => (float) $order->total_amount,
                    
                    // Dates
                    'ordered_at' => $order->ordered_at?->toISOString(),
                    'pickup_time' => $order->pickup_time?->toISOString(),
                    'completed_at' => $order->completed_at?->toISOString(),
                    'created_at' => $order->created_at->toISOString(),
                    
                    // Location
                    'location' => [
                        'id' => $order->location->id,
                        'name' => $order->location->name,
                        'address' => $order->location->address ?? null,
                    ],
                    
                    // Time slot
                    'time_slot' => $order->timeSlot ? [
                        'id' => $order->timeSlot->id,
                        'date' => $order->timeSlot->slot_date->format('Y-m-d'),
                        'time' => $order->timeSlot->slot_start_time,
                        'type' => $order->timeSlot->slot_type,
                    ] : null,
                    
                    // Delivery address (only for delivery orders)
                    'delivery_address' => ($order->order_type === 'delivery' && $order->customerAddress) ? [
                        'id' => $order->customerAddress->id,
                        'address_line_1' => $order->customerAddress->address_line_1,
                        'address_line_2' => $order->customerAddress->address_line_2,
                        'city' => $order->customerAddress->city,
                        'postal_code' => $order->customerAddress->postal_code,
                    ] : null,
                    
                    // Order items summary
                    'items_count' => $order->items->count(),
                    'items' => $order->items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'menu_item_id' => $item->menu_item_id,
                            'name' => $item->menuItem?->name ?? 'Unknown Item',
                            'quantity' => $item->quantity,
                            'unit_price' => (float) $item->unit_price,
                            'total_price' => (float) $item->total_price,
                            'special_instructions' => $item->special_instructions,
                            'image_path' => $item->menuItem?->image_path,
                        ];
                    })->toArray(),
                    
                    // Preview image
                    'preview_image' => $previewImage,
                    
                    // Special instructions
                    'special_instructions' => $order->special_instructions,
                    
                    // Payment info
                    'is_paid' => $order->payment_status === 'paid',
                    'invoice_id' => $order->invoice?->id,
                    
                    // Flags for action buttons
                    'can_cancel' => $order->status === 'pending' && $order->approval_status === 'pending',
                    'can_reorder' => in_array($order->status, ['completed', 'delivered']),
                ];
            }),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
                'from' => $orders->firstItem(),
                'to' => $orders->lastItem(),
            ]
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

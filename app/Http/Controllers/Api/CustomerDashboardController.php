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
     * Toggle favorite status for a menu item
     */
    public function toggleFavorite(Request $request)
    {
        $request->validate([
            'menu_item_id' => 'required|exists:menu_items,id',
        ]);

        $user = $request->user();
        $customer = Customer::where('user_id', $user->id)->firstOrFail();
        $menuItemId = $request->input('menu_item_id');

        $exists = DB::table('customer_favorites')
            ->where('customer_id', $customer->id)
            ->where('menu_item_id', $menuItemId)
            ->exists();

        if ($exists) {
            DB::table('customer_favorites')
                ->where('customer_id', $customer->id)
                ->where('menu_item_id', $menuItemId)
                ->delete();
            $status = 'removed';
        } else {
            DB::table('customer_favorites')->insert([
                'customer_id' => $customer->id,
                'menu_item_id' => $menuItemId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $status = 'added';
        }

        return response()->json([
            'status' => 'success',
            'action' => $status,
            'message' => $status === 'added' ? 'Added to favorites' : 'Removed from favorites'
        ]);
    }

    /**
     * Get list of favorite menu item Ids
     */
    public function getExplicitFavorites(Request $request)
    {
        $user = $request->user();
        $customer = Customer::where('user_id', $user->id)->first();

        if (!$customer) return response()->json(['data' => []]);

        $ids = DB::table('customer_favorites')
            ->where('customer_id', $customer->id)
            ->pluck('menu_item_id');

        return response()->json(['data' => $ids]);
    }

    /**
     * Get customer notifications
     */
    public function notifications(Request $request)
    {
        $user = $request->user();
        
        $notifications = $user->notifications()
            ->latest()
            ->paginate($request->per_page ?? 20);

        return response()->json($notifications);
    }

    /**
     * Get customer profile data
     */
    public function profile(Request $request)
    {
        $user = Auth::user();
        
        \Log::info('CustomerDashboardController::profile called', [
            'user_id' => $user ? $user->id : 'null',
            'guard' => 'default',
            'is_web' => Auth::guard('web')->check(),
            'is_sanctum' => Auth::guard('sanctum')->check(),
        ]);

        if (!$user) {
            return response()->json([
                'message' => 'User not authenticated',
            ], 401);
        }
        
        // Get customer record
        $customer = Customer::with(['user', 'preferredLocation'])
            ->where('user_id', $user->id)
            ->first();
            
        \Log::info('Customer lookup result', [
            'found' => $customer ? 'yes' : 'no',
            'customer_id' => $customer ? $customer->id : 'null'
        ]);

        if (!$customer) {
            return response()->json([
                'message' => 'Customer profile not found',
            ], 404);
        }

        // Calculate stats
        $totalOrders = Order::where('customer_id', $customer->id)->count();
        $totalSpent = Order::where('customer_id', $customer->id)
            ->whereIn('status', ['completed', 'open'])
            ->sum('total_amount');

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
                'customer_code' => $customer->customer_code,
                // Include full user object for profile page
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'avatar' => $user->avatar_url ?? $user->image_path_url,
                ],
                // Profile-specific fields
                'birth_date' => $customer->birth_date?->format('Y-m-d'),
                'gender' => $customer->gender,
                'preferred_language' => $customer->preferred_language ?? 'en',
                'marketing_consent' => (bool) $customer->marketing_consent,
                // Stats
                'loyalty_points' => $customer->points_balance,
                'total_orders' => $totalOrders,
                'total_spent' => (float) $totalSpent,
                'favorite_items' => $favoriteItems,
                'member_since' => $customer->created_at->toISOString(),
                'next_reward_points' => 100, // Next milestone
                'customer_tier' => $customer->customer_tier,
            ],
        ]);
    }

    /**
     * Get dashboard statistics
     */
    public function dashboardStats(Request $request)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['data' => [
                'orders_this_month' => 0,
                'orders_trend' => 0,
                'points_earned_this_month' => 0,
                'available_rewards' => 0,
            ]]);
        }
        
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
            // For pay_now orders, only show them once payment has been at least partially
            // completed. This prevents failed or abandoned immediate-payment attempts
            // from appearing in the customer's order history.
            ->where(function ($q) {
                $q->where('payment_mode', '!=', 'pay_now')
                  ->orWhereIn('payment_status', [
                      Order::PAYMENT_STATUS_PAID,
                      Order::PAYMENT_STATUS_PARTIAL,
                      Order::PAYMENT_STATUS_REFUNDED,
                  ]);
            })
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
                $previewImage = null;
                if ($firstItem = $order->items->first()) {
                    if ($menuItem = $firstItem->menuItem) {
                        $previewImage = $menuItem->image_path ? asset(ltrim(str_replace('\\', '/', $menuItem->image_path), '/')) : null;
                    }
                }

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
                            'image_path' => $item->menuItem?->image_path ? asset(ltrim(str_replace('\\', '/', $item->menuItem->image_path), '/')) : null,
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
                    // Can cancel if status is NOT preparing, ready, completed, or delivered
                    'can_cancel' => !in_array($order->status, ['preparing', 'ready', 'completed', 'delivered', 'cancelled']),
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
    /**
     * Get single order details
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        $customer = Customer::where('user_id', $user->id)->firstOrFail();

        $order = Order::where('customer_id', $customer->id)
            ->where('id', $id)
            ->with([
                'items.menuItem.translations',
                'location',
                'timeSlot',
                'customerAddress',
                'invoice',
                'paymentCollector'
            ])
            ->firstOrFail();

        // reuse basic mapping logic or simple response
        // for simplicity, returning mostly raw model with relations or mapped similar to orders list
        
        $previewImage = null;
        if ($firstItem = $order->items->first()) {
            if ($menuItem = $firstItem->menuItem) {
                $previewImage = $menuItem->image_path ? asset(ltrim(str_replace('\\', '/', $menuItem->image_path), '/')) : null;
            }
        }

        $data = [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'order_type' => $order->order_type,
            'status' => $order->status,
            'approval_status' => $order->approval_status,
            'payment_status' => $order->payment_status,
            'payment_mode' => $order->payment_mode,
            
            // Amounts
            'subtotal' => (float) $order->subtotal,
            'tax_amount' => (float) ($order->tax_amount ?? 0),
            'delivery_fee' => (float) ($order->delivery_fee ?? 0),
            'discount_amount' => (float) ($order->discount_amount ?? 0),
            'total_amount' => (float) $order->total_amount,
            'service_charge' => (float) ($order->service_charge ?? 0),
            
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
                'phone' => $order->location->phone ?? null,
                'email' => $order->location->email ?? null,
            ],
            
            // Time slot
            'time_slot' => $order->timeSlot ? [
                'id' => $order->timeSlot->id,
                'date' => $order->timeSlot->slot_date->format('Y-m-d'),
                'time' => $order->timeSlot->slot_start_time,
                'type' => $order->timeSlot->slot_type,
            ] : null,
            
            // Delivery address
            'delivery_address' => ($order->order_type === 'delivery' && $order->customerAddress) ? [
                'id' => $order->customerAddress->id,
                'address_line_1' => $order->customerAddress->address_line_1,
                'address_line_2' => $order->customerAddress->address_line_2,
                'city' => $order->customerAddress->city,
                'postal_code' => $order->customerAddress->postal_code,
                'label' => $order->customerAddress->label,
            ] : null,
            
            // Items
            'items_count' => $order->items->count(),
            'items' => $order->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'menu_item_id' => $item->menu_item_id,
                    'name' => $item->name ?? $item->menuItem?->name ?? 'Unknown Item',
                    'quantity' => $item->quantity,
                    'unit_price' => (float) $item->unit_price,
                    'total_price' => (float) $item->total_price,
                    'special_instructions' => $item->special_instructions,
                    'image_path' => $item->menuItem?->image_path ? asset(ltrim(str_replace('\\', '/', $item->menuItem->image_path), '/')) : null,
                    'customizations' => $item->customizations ?? [], // Assuming customizations might be stored
                ];
            }),
            
            'preview_image' => $previewImage,
            'special_instructions' => $order->special_instructions,
            'is_paid' => $order->payment_status === 'paid',
            // Can cancel if status is NOT preparing, ready, completed, or delivered
            'can_cancel' => !in_array($order->status, ['preparing', 'ready', 'completed', 'delivered', 'cancelled']),
        ];

        return response()->json(['data' => $data]);
    }

    /**
     * Cancel an order (customer-initiated)
     */
    public function cancel(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $customer = Customer::where('user_id', $user->id)->firstOrFail();

        $order = Order::where('customer_id', $customer->id)
            ->where('id', $id)
            ->firstOrFail();

        // Check if order can be cancelled
        // Cannot cancel if status is preparing, ready, completed, delivered, or already cancelled
        $nonCancellableStatuses = ['preparing', 'ready', 'completed', 'delivered', 'cancelled'];

        if (in_array($order->status, $nonCancellableStatuses)) {
            return response()->json([
                'status' => 'error',
                'message' => 'This order cannot be cancelled. Orders that are being prepared, ready for pickup, completed, or delivered cannot be cancelled.',
            ], 422);
        }

        // Update order status to cancelled
        $order->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancellation_reason' => $request->input('reason', 'Cancelled by customer'),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Order has been cancelled successfully.',
            'data' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'status' => $order->status,
            ]
        ]);
    }
}


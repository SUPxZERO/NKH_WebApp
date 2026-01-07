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
     * Helper to get current customer from Auth or Telegram Session
     */
    private function getCurrentCustomer(Request $request): ?Customer
    {
        // 1. Standard Auth
        if ($request->user()) {
            // Assuming User model has a hasOne Customer relationship
            return $request->user()->customer;
        }

        // 2. Telegram Session (set by TelegramWebAppAuth middleware)
        $telegramData = session('telegram_user');
        if ($telegramData && isset($telegramData['customer_id'])) {
             return Customer::find($telegramData['customer_id']);
        }

        return null;
    }

    /**
     * Toggle favorite status for a menu item
     */
    public function toggleFavorite(Request $request)
    {
        $request->validate([
            'menu_item_id' => 'required|exists:menu_items,id',
        ]);

        $customer = $this->getCurrentCustomer($request);
        if (!$customer) abort(404, 'Customer profile not found');

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
        $customer = $this->getCurrentCustomer($request);
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
        $customer = $this->getCurrentCustomer($request);
        if (!$customer) return response()->json(['data' => []]);
        
        // Use Notifiable trait on Customer model
        $notifications = $customer->notifications()
            ->latest()
            ->paginate($request->per_page ?? 20);

        return response()->json($notifications);
    }

    /**
     * Get customer profile data
     */
    public function profile(Request $request)
    {
        $customer = $this->getCurrentCustomer($request);
        
        \Log::info('CustomerDashboardController::profile called', [
            'customer_id' => $customer ? $customer->id : 'null',
        ]);

        if (!$customer) {
            return response()->json([
                'message' => 'Customer profile not found',
            ], 404);
        }
        
        // Get customer record
        // $customer is already loaded by getCurrentCustomer, potentially with user relation
        // If user relation is not loaded, we can load it here if needed for specific fields
        $customer->loadMissing(['user', 'preferredLocation']);
            
        \Log::info('Customer lookup result', [
            'found' => $customer ? 'yes' : 'no',
            'customer_id' => $customer ? $customer->id : 'null'
        ]);

        // Calculate stats
        $totalOrders = Order::where('customer_id', $customer->id)->count();
        $totalSpent = Order::where('customer_id', $customer->id)
            ->whereIn('status', ['completed', 'open'])
            ->sum('total_amount');

        // Get favorite items from customer_favorites table (explicit favorites)
        $locale = app()->getLocale();
        $favoriteItems = DB::table('customer_favorites')
            ->join('menu_items', 'customer_favorites.menu_item_id', '=', 'menu_items.id')
            ->leftJoin('menu_item_translations', function($join) use ($locale) {
                $join->on('menu_items.id', '=', 'menu_item_translations.menu_item_id')
                     ->where(function($q) use ($locale) {
                         $q->where('menu_item_translations.locale', '=', $locale)
                           ->orWhere('menu_item_translations.locale', '=', 'en');
                     });
            })
            ->where('customer_favorites.customer_id', $customer->id)
            ->select(
                'menu_items.id',
                DB::raw('COALESCE(menu_item_translations.name, menu_items.slug) as name'),
                'menu_items.price',
                'menu_items.image_path'
            )
            ->orderByDesc('customer_favorites.created_at')
            ->limit(5)
            ->get()
            ->map(function($item) {
                // Build proper image URL using APP_URL
                $imagePath = null;
                if ($item->image_path) {
                    $storagePath = ltrim(str_replace('\\', '/', $item->image_path), '/');
                    $imagePath = config('app.url') . '/storage/' . $storagePath;
                }
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'price' => (float) $item->price,
                    'image_path' => $imagePath,
                ];
            })
            ->toArray();

        // Points for next reward (every 100 points = 1 reward)
        $nextRewardPoints = 100 - ($customer->points_balance % 100);
        if ($customer->points_balance >= 100) {
            $nextRewardPoints = 100 - ($customer->points_balance % 100);
        }

        $user = $customer->user; // Could be null for Telegram users

        return response()->json([
            'data' => [
                'id' => $customer->id,
                'customer_code' => $customer->customer_code,
                // Include full user object for profile page (mock if missing)
                'user' => [
                    'id' => $user?->id ?? 0,
                    'name' => $user?->name ?? $customer->name,
                    'email' => $user?->email ?? $customer->email,
                    'phone' => $user?->phone ?? $customer->phone,
                    'avatar' => $user?->avatar_url ?? ($user?->image_path_url ?? null),
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
        $customer = $this->getCurrentCustomer($request);
        
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
        $customer = $this->getCurrentCustomer($request);
        $sessionToken = $request->header('X-Table-Session');
        $tableSession = null;

        if ($sessionToken) {
            $tableSession = \App\Models\TableSession::findByToken($sessionToken);
        }

        if (!$customer && !$tableSession) {
            return response()->json([
                'status' => 'error',
                'message' => 'Customer profile not found',
                'data' => []
            ], 404);
        }

        // Build query
        $query = Order::query();

        if ($customer) {
            $query->where('customer_id', $customer->id);
        } elseif ($tableSession) {
            $query->where('table_id', $tableSession->table_id)
                  ->where('created_at', '>=', $tableSession->started_at);
            
            // If session is closed, cap the query
            if ($tableSession->closed_at) {
                $query->where('created_at', '<=', $tableSession->closed_at);
            }
        }
        
        return $this->processOrdersQuery($query, $request);
    }

    /**
     * Helper to process orders query with filters and pagination
     */
    private function processOrdersQuery($query, Request $request) 
    {
        // Build query with eager loading to prevent N+1
        $query->where(function ($q) {
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
                        if ($menuItem->image_path) {
                            $storagePath = ltrim(str_replace('\\', '/', $menuItem->image_path), '/');
                            $previewImage = config('app.url') . '/storage/' . $storagePath;
                        }
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
                        // Build image URL
                        $imagePath = null;
                        if ($item->menuItem && $item->menuItem->image_path) {
                            $storagePath = ltrim(str_replace('\\', '/', $item->menuItem->image_path), '/');
                            $imagePath = config('app.url') . '/storage/' . $storagePath;
                        }
                        return [
                            'id' => $item->id,
                            'menu_item_id' => $item->menu_item_id,
                            'quantity' => $item->quantity,
                            'unit_price' => (float) $item->unit_price,
                            'total_price' => (float) $item->total_price,
                            'special_instructions' => $item->special_instructions,
                            'status' => $item->status ?? 'pending',
                            // Nested menu_item object to match frontend interface
                            'menu_item' => [
                                'name' => $item->menuItem?->name ?? 'Unknown Item',
                                'image_path' => $imagePath,
                            ],
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
        $customer = $this->getCurrentCustomer($request);

        if (!$customer) {
            return response()->json(['data' => []]);
        }

        // Get most frequently ordered items with locale fallback
        $locale = app()->getLocale();
        $favorites = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->leftJoin('menu_item_translations', function($join) use ($locale) {
                $join->on('menu_items.id', '=', 'menu_item_translations.menu_item_id')
                     ->where(function($q) use ($locale) {
                         $q->where('menu_item_translations.locale', '=', $locale)
                           ->orWhere('menu_item_translations.locale', '=', 'en');
                     });
            })
            ->where('orders.customer_id', $customer->id)
            ->select(
                'menu_items.id',
                'menu_items.slug',
                'menu_items.price',
                'menu_items.image_path',
                DB::raw('COALESCE(menu_item_translations.name, menu_items.slug) as name'),
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
        $customer = $this->getCurrentCustomer($request);
        $sessionToken = $request->header('X-Table-Session');
        $tableSession = null;

        if ($sessionToken) {
            $tableSession = \App\Models\TableSession::findByToken($sessionToken);
        }

        if (!$customer && !$tableSession) {
             return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $query = Order::where('id', $id)
            ->with([
                'items.menuItem.translations',
                'location',
                'timeSlot',
                'customerAddress',
                'invoice',
                'paymentCollector'
            ]);

        if ($customer) {
            $query->where('customer_id', $customer->id);
        } elseif ($tableSession) {
            $query->where('table_id', $tableSession->table_id)
                  ->where('created_at', '>=', $tableSession->started_at);
        }

        $order = $query->firstOrFail();

        return $this->formatOrderResponse($order);
    }

    /**
     * Helper to format order response
     */
    private function formatOrderResponse($order)
    {
        $previewImage = null;
        if ($firstItem = $order->items->first()) {
            if ($menuItem = $firstItem->menuItem) {
                if ($menuItem->image_path) {
                    $storagePath = ltrim(str_replace('\\', '/', $menuItem->image_path), '/');
                    $previewImage = config('app.url') . '/storage/' . $storagePath;
                }
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
                // Build image URL
                $imagePath = null;
                if ($item->menuItem && $item->menuItem->image_path) {
                    $storagePath = ltrim(str_replace('\\', '/', $item->menuItem->image_path), '/');
                    $imagePath = config('app.url') . '/storage/' . $storagePath;
                }
                return [
                    'id' => $item->id,
                    'menu_item_id' => $item->menu_item_id,
                    'name' => $item->name ?? $item->menuItem?->name ?? 'Unknown Item',
                    'quantity' => $item->quantity,
                    'unit_price' => (float) $item->unit_price,
                    'total_price' => (float) $item->total_price,
                    'special_instructions' => $item->special_instructions,
                    'image_path' => $imagePath,
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
     * Reorder items from a previous order
     */
    public function reorder(Request $request, $id)
    {
        $customer = $this->getCurrentCustomer($request);
        if (!$customer) return response()->json(['message' => 'Unauthenticated'], 401);

        \Log::info('Reorder requested', ['customer_id' => $customer->id, 'order_id' => $id]);

        $order = Order::where('customer_id', $customer->id)
            ->where('id', $id)
            ->with(['items'])
            ->firstOrFail();

        \Log::info('Order found for reorder', ['items_count' => $order->items->count()]);

        // Add items to cart
        try {
            DB::beginTransaction();
            
            $addedCount = 0;
            foreach ($order->items as $item) {
                \Log::info('Processing reorder item', ['item_id' => $item->id, 'menu_item_id' => $item->menu_item_id]);

                // Optional: Check if menu item still exists
                $menuItemExists = \App\Models\MenuItem::where('id', $item->menu_item_id)->exists();
                if (!$menuItemExists) {
                    \Log::warning('Skipping reorder item - Menu Item not found', ['menu_item_id' => $item->menu_item_id]);
                    continue;
                }

                $cartItem = \App\Models\CartItem::where('customer_id', $customer->id)
                    ->where('menu_item_id', $item->menu_item_id)
                    ->first();
                
                if ($cartItem) {
                    $cartItem->increment('quantity', $item->quantity);
                    \Log::info('Incremented cart item', ['cart_item_id' => $cartItem->id]);
                } else {
                    $newCartItem = \App\Models\CartItem::create([
                        'customer_id' => $customer->id,
                        'menu_item_id' => $item->menu_item_id,
                        'quantity' => $item->quantity,
                        'notes' => $item->special_instructions,
                        'customizations' => [], // Default to empty array
                    ]);
                    \Log::info('Created new cart item', ['cart_item_id' => $newCartItem->id]);
                }
                $addedCount++;
            }
            
            DB::commit();
            \Log::info('Reorder transaction completed', ['added_items' => $addedCount]);

            if ($addedCount === 0) {
                 return response()->json([
                    'status' => 'warning',
                    'message' => 'No valid items could be reordered (items may no longer be available).',
                ]);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Items added to cart',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Reorder failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to reorder items: ' . $e->getMessage()], 500);
        }
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

    /**
     * Get customer loyalty stats
     */
    /**
     * Get customer loyalty stats
     */
    public function loyaltyStats(Request $request)
    {
        $customer = $this->getCurrentCustomer($request);

        if (!$customer) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Calculate total orders and lifetime spend
        $totalOrders = Order::where('customer_id', $customer->id)
            ->whereIn('status', ['completed', 'ready', 'delivered'])
            ->count();

        $lifetimeSpend = Order::where('customer_id', $customer->id)
            ->whereIn('status', ['completed', 'ready', 'delivered'])
            ->sum('total_amount');

        // Get current tier and calculate next tier
        $currentTier = $customer->customer_tier ?? 'bronze';
        $tierThresholds = [
            'bronze' => 0,
            'silver' => 2000,
            'gold' => 5000,
            'platinum' => 10000,
        ];

        $nextTier = null;
        $nextTierThreshold = null;
        $progressToNextTier = 0;

        switch ($currentTier) {
            case 'bronze':
                $nextTier = 'silver';
                $nextTierThreshold = $tierThresholds['silver'];
                $progressToNextTier = $nextTierThreshold > 0 
                    ? min(100, ($lifetimeSpend / $nextTierThreshold) * 100) 
                    : 0;
                break;
            case 'silver':
                $nextTier = 'gold';
                $nextTierThreshold = $tierThresholds['gold'];
                $currentTierMin = $tierThresholds['silver'];
                $progressToNextTier = min(100, (($lifetimeSpend - $currentTierMin) / ($nextTierThreshold - $currentTierMin)) * 100);
                break;
            case 'gold':
                $nextTier = 'platinum';
                $nextTierThreshold = $tierThresholds['platinum'];
                $currentTierMin = $tierThresholds['gold'];
                $progressToNextTier = min(100, (($lifetimeSpend - $currentTierMin) / ($nextTierThreshold - $currentTierMin)) * 100);
                break;
            case 'platinum':
                $nextTier = null;
                $nextTierThreshold = null;
                $progressToNextTier = 100;
                break;
        }

        return response()->json([
            'data' => [
                'points_balance' => (int) $customer->points_balance,
                'current_tier' => $currentTier,
                'next_tier' => $nextTier,
                'next_tier_threshold' => $nextTierThreshold,
                'progress_to_next_tier' => round($progressToNextTier, 2),
                'lifetime_spend' => (float) $lifetimeSpend,
                'total_orders' => $totalOrders,
            ]
        ]);
    }

    /**
     * Get customer loyalty transaction history
     */
    public function loyaltyHistory(Request $request)
    {
        $customer = $this->getCurrentCustomer($request);

        if (!$customer) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Get last 20 loyalty transactions
        $transactions = LoyaltyPoint::where('customer_id', $customer->id)
            ->orderBy('occurred_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'type' => $transaction->type,
                    'points' => $transaction->points,
                    'balance_after' => $transaction->balance_after,
                    'description' => $transaction->notes ?? $transaction->description ?? 'Loyalty transaction',
                    'occurred_at' => $transaction->occurred_at->toISOString(),
                ];
            });

        return response()->json([
            'data' => $transactions
        ]);
    }
}



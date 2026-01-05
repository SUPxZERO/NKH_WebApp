<?php

namespace App\Http\Controllers\Api\Telegram;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\TelegramUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TelegramCheckoutController extends Controller
{
    /**
     * Validate cart before checkout
     */
    public function validate(Request $request): JsonResponse
    {
        /** @var TelegramUser $user */
        $user = $request->user('telegram');
        $cartData = $user->conversation_data['cart'] ?? null;

        if (!$cartData || empty($cartData['items'])) {
            return response()->json([
                'success' => false,
                'error' => 'Cart is empty',
                'can_checkout' => false,
            ], 400);
        }

        $items = $cartData['items'];
        $validItems = [];
        $invalidItems = [];

        foreach ($items as $item) {
            $menuItem = MenuItem::with('translations')->find($item['menu_item_id']);
            if ($menuItem && $menuItem->isAvailable()) {
                $validItems[] = [
                    'menu_item_id' => $menuItem->id,
                    'name' => $menuItem->name,
                    'quantity' => $item['quantity'],
                    'unit_price' => $menuItem->price,
                    'total_price' => $menuItem->price * $item['quantity'],
                ];
            } else {
                $invalidItems[] = $item['name'] ?? 'Unknown item';
            }
        }

        if (empty($validItems)) {
            return response()->json([
                'success' => false,
                'error' => 'No valid items in cart',
                'can_checkout' => false,
            ], 400);
        }

        $subtotal = collect($validItems)->sum('total_price');
        $taxAmount = $subtotal * 0.1; // 10% tax
        $totalAmount = $subtotal + $taxAmount;

        return response()->json([
            'success' => true,
            'can_checkout' => true,
            'data' => [
                'items' => $validItems,
                'invalid_items' => $invalidItems,
                'subtotal' => round($subtotal, 2),
                'tax_amount' => round($taxAmount, 2),
                'total_amount' => round($totalAmount, 2),
                'item_count' => count($validItems),
            ],
        ]);
    }

    /**
     * Save guest contact information
     */
    public function saveGuestInfo(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone_number' => 'nullable|string|max:20',
            'delivery_address' => 'nullable|string|max:500',
            'address_label' => 'nullable|string|max:50',
            'address_line_1' => 'nullable|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'save_for_future' => 'nullable|boolean',
        ]);

        /** @var TelegramUser $user */
        $user = $request->user('telegram');

        $updates = [];
        
        if (isset($validated['phone_number'])) {
            $updates['phone_number'] = $validated['phone_number'];
        }
        
        if (isset($validated['delivery_address'])) {
            $updates['delivery_address'] = $validated['delivery_address'];
        }
        
        // Save structured address to database if save_for_future is requested
        if (($validated['save_for_future'] ?? false) && isset($validated['address_line_1'])) {
            // Determine ownership - customer_id for linked, telegram_user_id for guests
            $ownerField = $user->hasLinkedAccount() ? 'customer_id' : 'telegram_user_id';
            $ownerId = $user->hasLinkedAccount() ? $user->customer_id : $user->id;
            
            // Check if address already exists
            $existingAddress = \App\Models\CustomerAddress::where($ownerField, $ownerId)
                ->where('address_line_1', $validated['address_line_1'])
                ->where('city', $validated['city'] ?? '')
                ->first();
            
            if (!$existingAddress) {
                \App\Models\CustomerAddress::create([
                    $ownerField => $ownerId,
                    'label' => $validated['address_label'] ?? 'Home',
                    'address_line_1' => $validated['address_line_1'],
                    'address_line_2' => $validated['address_line_2'] ?? null,
                    'city' => $validated['city'] ?? '',
                    'province' => $validated['province'] ?? $validated['city'] ?? '',
                    'postal_code' => $validated['postal_code'] ?? '',
                    'is_default' => false,
                ]);
            }
        }

        if (!empty($updates)) {
            $user->update($updates);
        }

        // Get addresses from database for response
        $ownerField = $user->hasLinkedAccount() ? 'customer_id' : 'telegram_user_id';
        $ownerId = $user->hasLinkedAccount() ? $user->customer_id : $user->id;
        $savedAddresses = \App\Models\CustomerAddress::where($ownerField, $ownerId)
            ->get()
            ->map(fn($addr) => [
                'id' => $addr->id,
                'label' => $addr->label,
                'address_line_1' => $addr->address_line_1,
                'city' => $addr->city,
            ])
            ->toArray();

        return response()->json([
            'success' => true,
            'message' => 'Guest info saved',
            'data' => [
                'phone_number' => $user->phone_number,
                'delivery_address' => $user->delivery_address,
                'saved_addresses' => $savedAddresses,
            ],
        ]);
    }

    /**
     * Place a guest order (no customer account required)
     */
    public function placeOrder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_type' => 'required|in:pickup,delivery',
            'location_id' => 'required|exists:locations,id',
            'time_slot_date' => 'nullable|date',
            'time_slot_time' => 'nullable|string',
            'payment_mode' => 'required|in:pay_now,pay_on_delivery,pay_on_pickup',
            'special_instructions' => 'nullable|string|max:500',
            'delivery_address' => 'nullable|string|max:500',
            'phone_number' => 'nullable|string|max:20',
        ]);

        /** @var TelegramUser $user */
        $user = $request->user('telegram');
        $cartData = $user->conversation_data['cart'] ?? null;

        if (!$cartData || empty($cartData['items'])) {
            return response()->json([
                'success' => false,
                'error' => 'Cart is empty',
            ], 400);
        }

        // For delivery, require address
        if ($validated['order_type'] === 'delivery') {
            $address = $validated['delivery_address'] ?? $user->delivery_address;
            if (empty($address)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Delivery address is required',
                ], 400);
            }
        }

        // Save phone if provided
        if (!empty($validated['phone_number']) && $validated['phone_number'] !== $user->phone_number) {
            $user->update(['phone_number' => $validated['phone_number']]);
        }

        try {
            $order = DB::transaction(function () use ($validated, $user, $cartData) {
                // Calculate totals
                $subtotal = 0;
                $orderItems = [];

                foreach ($cartData['items'] as $item) {
                    $menuItem = MenuItem::with('translations')->find($item['menu_item_id']);
                    if (!$menuItem || !$menuItem->isAvailable()) {
                        throw new \Exception("Item {$item['name']} is no longer available");
                    }

                    $itemTotal = $menuItem->price * $item['quantity'];
                    $subtotal += $itemTotal;

                    $orderItems[] = [
                        'menu_item_id' => $menuItem->id,
                        'quantity' => $item['quantity'],
                        'unit_price' => $menuItem->price,
                        'total_price' => $itemTotal,
                        'special_instructions' => $item['special_instructions'] ?? null,
                    ];
                }

                $taxAmount = $subtotal * 0.1;
                $deliveryFee = $validated['order_type'] === 'delivery' ? 2.50 : 0;
                $totalAmount = $subtotal + $taxAmount + $deliveryFee;

                // Generate order number
                $orderNumber = 'TG' . date('ymd') . strtoupper(substr(uniqid(), -6));

                // Create order - linked to TelegramUser, NOT Customer
                $order = Order::create([
                    'telegram_user_id' => $user->id,
                    'customer_id' => $user->customer_id, // Link to customer if exists
                    'location_id' => $validated['location_id'],
                    'order_number' => $orderNumber,
                    'order_type' => $validated['order_type'],
                    'status' => 'pending',
                    'payment_status' => $validated['payment_mode'] === 'pay_now' ? 'unpaid' : 'unpaid',
                    'payment_mode' => $validated['payment_mode'],
                    'subtotal' => $subtotal,
                    'tax_amount' => $taxAmount,
                    'delivery_fee' => $deliveryFee,
                    'total_amount' => $totalAmount,
                    'ordered_at' => now(),
                    'special_instructions' => $validated['special_instructions'] ?? null,
                    'delivery_instructions' => $validated['delivery_address'] ?? $user->delivery_address,
                    'approval_status' => 'pending',
                ]);

                // Create order items
                foreach ($orderItems as $item) {
                    $order->items()->create($item);
                }

                // Clear cart from conversation data
                $user->setConversationData('cart', null);

                return $order;
            });

            return response()->json([
                'success' => true,
                'message' => 'Order placed successfully',
                'data' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'total_amount' => $order->total_amount,
                    'status' => $order->status,
                    'payment_mode' => $order->payment_mode,
                    'order_type' => $order->order_type,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Telegram guest order failed', [
                'telegram_user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get order confirmation details
     */
    public function confirm(Request $request, int $orderId): JsonResponse
    {
        /** @var TelegramUser $user */
        $user = $request->user('telegram');

        $order = Order::where('id', $orderId)
            ->where(function ($query) use ($user) {
                $query->where('telegram_user_id', $user->id)
                    ->orWhere('customer_id', $user->customer_id);
            })
            ->with(['items.menuItem', 'location'])
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'error' => 'Order not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'status' => $order->status,
                'payment_status' => $order->payment_status,
                'payment_mode' => $order->payment_mode,
                'order_type' => $order->order_type,
                'subtotal' => (float) $order->subtotal,
                'tax_amount' => (float) $order->tax_amount,
                'delivery_fee' => (float) $order->delivery_fee,
                'total_amount' => (float) $order->total_amount,
                'ordered_at' => $order->ordered_at?->toIsoString(),
                'special_instructions' => $order->special_instructions,
                'location' => $order->location ? [
                    'id' => $order->location->id,
                    'name' => $order->location->name,
                    'address' => $order->location->address_line1,
                ] : null,
                'items' => $order->items->map(fn($item) => [
                    'name' => $item->menuItem?->name ?? 'Unknown',
                    'quantity' => $item->quantity,
                    'unit_price' => (float) $item->unit_price,
                    'total_price' => (float) $item->total_price,
                ]),
            ],
        ]);
    }

    /**
     * Get saved addresses for the user (from database)
     */
    public function getSavedAddresses(Request $request): JsonResponse
    {
        /** @var TelegramUser $user */
        $user = $request->user('telegram');

        // Get addresses from database
        $ownerField = $user->hasLinkedAccount() ? 'customer_id' : 'telegram_user_id';
        $ownerId = $user->hasLinkedAccount() ? $user->customer_id : $user->id;

        $savedAddresses = \App\Models\CustomerAddress::where($ownerField, $ownerId)
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($addr) => [
                'id' => $addr->id,
                'label' => $addr->label,
                'address_line_1' => $addr->address_line_1,
                'address_line_2' => $addr->address_line_2,
                'city' => $addr->city,
                'province' => $addr->province,
                'postal_code' => $addr->postal_code,
                'delivery_instructions' => $addr->delivery_instructions,
                'is_default' => (bool) $addr->is_default,
            ])
            ->toArray();

        return response()->json([
            'success' => true,
            'data' => [
                'current_address' => $user->delivery_address,
                'saved_addresses' => $savedAddresses,
                'phone_number' => $user->phone_number,
            ],
        ]);
    }
}

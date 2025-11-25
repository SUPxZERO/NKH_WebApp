<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\Customer;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CartController extends Controller
{
    /**
     * Get customer's cart
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $customer = Customer::where('user_id', $user->id)->first();

        if (!$customer) {
            return response()->json(['data' => []]);
        }

        $cartItems = CartItem::where('customer_id', $customer->id)
            ->with(['menuItem.translations'])
            ->get()
            ->map(function ($item) {
                $menuItem = $item->menuItem;
                $translation = $menuItem->translations->firstWhere('locale', app()->getLocale()) 
                    ?? $menuItem->translations->first();

                return [
                    'id' => $item->id,
                    'menu_item_id' => $item->menu_item_id,
                    'name' => $translation ? $translation->name : $menuItem->slug,
                    'unit_price' => (float) $menuItem->price,
                    'quantity' => $item->quantity,
                    'notes' => $item->notes,
                    'customizations' => $item->customizations,
                    'image_url' => $menuItem->image_path ? asset($menuItem->image_path) : null,
                ];
            });

        return response()->json(['data' => $cartItems]);
    }

    /**
     * Add item to cart or update quantity if exists
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'menu_item_id' => 'required|exists:menu_items,id',
            'quantity' => 'required|integer|min:1|max:99',
            'notes' => 'nullable|string|max:500',
            'customizations' => 'nullable|array',
        ]);

        $user = $request->user();
        $customer = Customer::where('user_id', $user->id)->first();

        if (!$customer) {
            return response()->json(['message' => 'Customer not found'], 404);
        }

        // Check if item already in cart
        $cartItem = CartItem::where('customer_id', $customer->id)
            ->where('menu_item_id', $validated['menu_item_id'])
            ->first();

        if ($cartItem) {
            // Update quantity
            $cartItem->quantity += $validated['quantity'];
            $cartItem->save();
        } else {
            // Create new cart item
            $cartItem = CartItem::create([
                'customer_id' => $customer->id,
                'menu_item_id' => $validated['menu_item_id'],
                'quantity' => $validated['quantity'],
                'notes' => $validated['notes'] ?? null,
                'customizations' => $validated['customizations'] ?? null,
            ]);
        }

        return response()->json([
            'message' => 'Item added to cart',
            'data' => $cartItem,
        ], 201);
    }

    /**
     * Update cart item quantity
     */
    public function update(Request $request, CartItem $cartItem)
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1|max:99',
            'notes' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $customer = Customer::where('user_id', $user->id)->first();

        // Verify ownership
        if ($cartItem->customer_id !== $customer->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $cartItem->update($validated);

        return response()->json([
            'message' => 'Cart item updated',
            'data' => $cartItem,
        ]);
    }

    /**
     * Remove item from cart
     */
    public function destroy(CartItem $cartItem, Request $request)
    {
        $user = $request->user();
        $customer = Customer::where('user_id', $user->id)->first();

        // Verify ownership
        if ($cartItem->customer_id !== $customer->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $cartItem->delete();

        return response()->json([
            'message' => 'Item removed from cart',
        ]);
    }

    /**
     * Clear entire cart
     */
    public function clear(Request $request)
    {
        $user = $request->user();
        $customer = Customer::where('user_id', $user->id)->first();

        if (!$customer) {
            return response()->json(['message' => 'Customer not found'], 404);
        }

        CartItem::where('customer_id', $customer->id)->delete();

        return response()->json([
            'message' => 'Cart cleared',
        ]);
    }

    /**
     * Sync cart from frontend (merge local cart with server cart)
     */
    public function sync(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1|max:99',
            'items.*.notes' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $customer = Customer::where('user_id', $user->id)->first();

        if (!$customer) {
            return response()->json(['message' => 'Customer not found'], 404);
        }

        DB::beginTransaction();
        try {
            // Clear existing cart
            CartItem::where('customer_id', $customer->id)->delete();

            // Add all items from frontend
            foreach ($validated['items'] as $item) {
                CartItem::create([
                    'customer_id' => $customer->id,
                    'menu_item_id' => $item['menu_item_id'],
                    'quantity' => $item['quantity'],
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            DB::commit();

            // Return updated cart
            return $this->index($request);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Sync failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

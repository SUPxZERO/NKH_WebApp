<?php

namespace App\Http\Controllers\Api\Telegram;

use App\Http\Controllers\Controller;
use App\Models\TelegramUser;
use App\Services\Telegram\TelegramCartSessionManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TelegramCartController extends Controller
{
    /**
     * Get cart contents
     */
    public function get(Request $request): JsonResponse
    {
        $user = $request->user('telegram');
        $cart = new TelegramCartSessionManager($user);
        $items = $cart->getItems();

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $items,
                'item_count' => $cart->getItemCount(),
                'subtotal' => $cart->getSubtotal(),
                'tax_amount' => $cart->getTaxAmount(),
                'total_amount' => $cart->getTotalAmount(),
                'is_empty' => $cart->isEmpty(),
            ],
        ]);
    }

    /**
     * Add item to cart
     */
    public function add(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'menu_item_id' => 'required|exists:menu_items,id',
            'quantity' => 'nullable|integer|min:1|max:20',
            'special_instructions' => 'nullable|string|max:500',
        ]);

        $user = $request->user('telegram');
        $cart = new TelegramCartSessionManager($user);

        $quantity = $validated['quantity'] ?? 1;
        $instructions = $validated['special_instructions'] ?? null;

        $success = $cart->addItem(
            $validated['menu_item_id'],
            $quantity,
            $instructions
        );

        if ($success) {
            return response()->json([
                'success' => true,
                'message' => 'Item added to cart',
                'data' => [
                    'item_count' => $cart->getItemCount(),
                    'total' => $cart->getTotalAmount(),
                ],
            ]);
        }

        return response()->json([
            'success' => false,
            'error' => 'Could not add item to cart',
        ], 400);
    }

    /**
     * Update item quantity
     */
    public function update(Request $request, int $menuItemId): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:0|max:20',
        ]);

        $user = $request->user('telegram');
        $cart = new TelegramCartSessionManager($user);

        $success = $cart->updateQuantity($menuItemId, $validated['quantity']);

        if ($success) {
            return response()->json([
                'success' => true,
                'message' => 'Cart updated',
                'data' => [
                    'item_count' => $cart->getItemCount(),
                    'total' => $cart->getTotalAmount(),
                ],
            ]);
        }

        return response()->json([
            'success' => false,
            'error' => 'Could not update cart',
        ], 400);
    }

    /**
     * Remove item from cart
     */
    public function remove(Request $request, int $menuItemId): JsonResponse
    {
        $user = $request->user('telegram');
        $cart = new TelegramCartSessionManager($user);

        $success = $cart->removeItem($menuItemId);

        if ($success) {
            return response()->json([
                'success' => true,
                'message' => 'Item removed from cart',
                'data' => [
                    'item_count' => $cart->getItemCount(),
                    'total' => $cart->getTotalAmount(),
                ],
            ]);
        }

        return response()->json([
            'success' => false,
            'error' => 'Could not remove item',
        ], 400);
    }

    /**
     * Clear cart
     */
    public function clear(Request $request): JsonResponse
    {
        $user = $request->user('telegram');
        $cart = new TelegramCartSessionManager($user);
        $cart->clearCart();

        return response()->json([
            'success' => true,
            'message' => 'Cart cleared',
        ]);
    }

    /**
     * Get cart totals
     */
    public function total(Request $request): JsonResponse
    {
        $user = $request->user('telegram');
        $cart = new TelegramCartSessionManager($user);

        return response()->json([
            'success' => true,
            'data' => [
                'item_count' => $cart->getItemCount(),
                'subtotal' => $cart->getSubtotal(),
                'tax_amount' => $cart->getTaxAmount(),
                'total_amount' => $cart->getTotalAmount(),
                'is_empty' => $cart->isEmpty(),
            ],
        ]);
    }
}

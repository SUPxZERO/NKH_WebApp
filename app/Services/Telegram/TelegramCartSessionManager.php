<?php

namespace App\Services\Telegram;

use App\Models\MenuItem;
use App\Models\TelegramUser;

/**
 * Manages cart data stored in TelegramUser's conversation_data
 */
class TelegramCartSessionManager
{
    private TelegramUser $user;
    private array $cart;
    
    private const CART_KEY = 'cart';
    private const TAX_RATE = 0.10; // 10% tax

    public function __construct(TelegramUser $user)
    {
        $this->user = $user;
        $this->cart = $user->conversation_data[self::CART_KEY] ?? ['items' => []];
    }

    /**
     * Add item to cart
     */
    public function addItem(int $menuItemId, int $quantity = 1, ?string $specialInstructions = null): bool
    {
        $menuItem = MenuItem::with('translations')->find($menuItemId);
        if (!$menuItem || !$menuItem->isAvailable()) {
            return false;
        }

        $existingIndex = $this->findItemIndex($menuItemId);
        
        if ($existingIndex !== null) {
            // Update existing item quantity
            $this->cart['items'][$existingIndex]['quantity'] += $quantity;
            if ($specialInstructions) {
                $this->cart['items'][$existingIndex]['special_instructions'] = $specialInstructions;
            }
        } else {
            // Add new item
            $this->cart['items'][] = [
                'menu_item_id' => $menuItemId,
                'name' => $menuItem->name, // computed attribute from translations
                'price' => (float) $menuItem->price,
                'quantity' => $quantity,
                'special_instructions' => $specialInstructions,
            ];
        }

        return $this->save();
    }

    /**
     * Update item quantity
     */
    public function updateQuantity(int $menuItemId, int $quantity): bool
    {
        $index = $this->findItemIndex($menuItemId);
        
        if ($index === null) {
            return false;
        }

        if ($quantity <= 0) {
            // Remove item if quantity is 0 or less
            array_splice($this->cart['items'], $index, 1);
        } else {
            $this->cart['items'][$index]['quantity'] = $quantity;
        }

        return $this->save();
    }

    /**
     * Remove item from cart
     */
    public function removeItem(int $menuItemId): bool
    {
        $index = $this->findItemIndex($menuItemId);
        
        if ($index === null) {
            return false;
        }

        array_splice($this->cart['items'], $index, 1);
        return $this->save();
    }

    /**
     * Clear all items from cart
     */
    public function clearCart(): bool
    {
        $this->cart = ['items' => []];
        return $this->save();
    }

    /**
     * Get all cart items with calculated totals
     */
    public function getItems(): array
    {
        return array_map(function ($item) {
            return [
                ...$item,
                'total_price' => $item['price'] * $item['quantity'],
            ];
        }, $this->cart['items']);
    }

    /**
     * Get total item count
     */
    public function getItemCount(): int
    {
        return array_sum(array_column($this->cart['items'], 'quantity'));
    }

    /**
     * Get cart subtotal (before tax)
     */
    public function getSubtotal(): float
    {
        return array_reduce($this->cart['items'], function ($sum, $item) {
            return $sum + ($item['price'] * $item['quantity']);
        }, 0);
    }

    /**
     * Get tax amount
     */
    public function getTaxAmount(): float
    {
        return round($this->getSubtotal() * self::TAX_RATE, 2);
    }

    /**
     * Get total amount (including tax)
     */
    public function getTotalAmount(): float
    {
        return round($this->getSubtotal() + $this->getTaxAmount(), 2);
    }

    /**
     * Check if cart is empty
     */
    public function isEmpty(): bool
    {
        return empty($this->cart['items']);
    }

    /**
     * Find index of item in cart
     */
    private function findItemIndex(int $menuItemId): ?int
    {
        foreach ($this->cart['items'] as $index => $item) {
            if ($item['menu_item_id'] === $menuItemId) {
                return $index;
            }
        }
        return null;
    }

    /**
     * Save cart to user's conversation_data
     */
    private function save(): bool
    {
        $conversationData = $this->user->conversation_data ?? [];
        $conversationData[self::CART_KEY] = $this->cart;
        
        return $this->user->update(['conversation_data' => $conversationData]);
    }
}

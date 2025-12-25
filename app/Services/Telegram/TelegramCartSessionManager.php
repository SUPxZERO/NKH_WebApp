<?php

namespace App\Services\Telegram;

use App\Models\Customer;
use App\Models\MenuItem;
use App\Models\TelegramUser;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TelegramCartSessionManager
{
    /**
     * Cart session key prefix
     */
    private const CART_KEY = 'telegram_cart';

    /**
     * Cart expiry in minutes
     */
    private const CART_EXPIRY_MINUTES = 60;

    /**
     * Maximum cart items
     */
    private const MAX_CART_ITEMS = 20;

    /**
     * Telegram user
     */
    private TelegramUser $telegramUser;

    /**
     * Cart data
     */
    private ?array $cart = null;

    public function __construct(TelegramUser $telegramUser)
    {
        $this->telegramUser = $telegramUser;
        $this->loadCart();
    }

    /**
     * Load cart from session or database
     */
    private function loadCart(): void
    {
        $this->cart = $this->telegramUser->getConversationData('cart');

        // Check if cart is expired
        if ($this->cart && isset($this->cart['updated_at'])) {
            $updatedAt = now()->parse($this->cart['updated_at']);
            if ($updatedAt->diffInMinutes(now()) > self::CART_EXPIRY_MINUTES) {
                $this->clearCart();
            }
        }

        // Initialize cart if empty
        if (!$this->cart) {
            $this->cart = [
                'items' => [],
                'location_id' => null,
                'order_type' => null,
                'time_slot_id' => null,
                'customer_address_id' => null,
                'promotion_code' => null,
                'special_instructions' => null,
                'subtotal' => 0,
                'tax_amount' => 0,
                'total_amount' => 0,
                'created_at' => now()->toISOString(),
                'updated_at' => now()->toISOString(),
            ];
        }
    }

    /**
     * Save cart to session
     */
    private function saveCart(): void
    {
        $this->cart['updated_at'] = now()->toISOString();

        $this->telegramUser->setConversationData('cart', $this->cart);
    }

    /**
     * Get cart items
     */
    public function getItems(): Collection
    {
        if (empty($this->cart['items'])) {
            return collect([]);
        }

        $itemIds = array_column($this->cart['items'], 'menu_item_id');

        $menuItems = MenuItem::whereIn('id', $itemIds)->get()->keyBy('id');

        return collect($this->cart['items'])->map(function ($item) use ($menuItems) {
            $menuItem = $menuItems->get($item['menu_item_id']);

            return [
                'menu_item_id' => $item['menu_item_id'],
                'name' => $menuItem?->name ?? $item['name'] ?? 'Unknown Item',
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'total_price' => $item['total_price'],
                'special_instructions' => $item['special_instructions'] ?? null,
                'menu_item' => $menuItem,
            ];
        });
    }

    /**
     * Get cart item count
     */
    public function getItemCount(): int
    {
        return array_sum(array_column($this->cart['items'] ?? [], 'quantity'));
    }

    /**
     * Add item to cart
     */
    public function addItem(int $menuItemId, int $quantity = 1, ?string $specialInstructions = null): bool
    {
        // Validate quantity
        if ($quantity < 1) {
            return false;
        }

        // Get menu item
        $menuItem = MenuItem::find($menuItemId);
        if (!$menuItem) {
            Log::warning('TelegramCart: Menu item not found', ['menu_item_id' => $menuItemId]);
            return false;
        }

        // Check if item is available
        if (!$menuItem->is_active) {
            Log::warning('TelegramCart: Menu item is inactive', ['menu_item_id' => $menuItemId]);
            return false;
        }

        // Check cart size
        $currentCount = $this->getItemCount();
        if ($currentCount + $quantity > self::MAX_CART_ITEMS) {
            Log::warning('TelegramCart: Cart size limit exceeded', [
                'current' => $currentCount,
                'adding' => $quantity,
                'limit' => self::MAX_CART_ITEMS,
            ]);
            return false;
        }

        // Check if item already in cart
        $existingIndex = $this->findItemIndex($menuItemId);

        if ($existingIndex !== null) {
            // Update quantity
            $this->cart['items'][$existingIndex]['quantity'] += $quantity;
            $this->cart['items'][$existingIndex]['total_price'] =
                $this->cart['items'][$existingIndex]['unit_price'] *
                $this->cart['items'][$existingIndex]['quantity'];

            if ($specialInstructions) {
                $this->cart['items'][$existingIndex]['special_instructions'] = $specialInstructions;
            }
        } else {
            // Add new item
            $this->cart['items'][] = [
                'menu_item_id' => $menuItemId,
                'name' => $menuItem->name,
                'quantity' => $quantity,
                'unit_price' => (float) $menuItem->price,
                'total_price' => (float) $menuItem->price * $quantity,
                'special_instructions' => $specialInstructions,
            ];
        }

        $this->recalculateTotals();
        $this->saveCart();

        Log::debug('TelegramCart: Item added', [
            'telegram_user_id' => $this->telegramUser->id,
            'menu_item_id' => $menuItemId,
            'quantity' => $quantity,
        ]);

        return true;
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

        if ($quantity < 1) {
            return $this->removeItem($menuItemId);
        }

        $this->cart['items'][$index]['quantity'] = $quantity;
        $this->cart['items'][$index]['total_price'] =
            $this->cart['items'][$index]['unit_price'] * $quantity;

        $this->recalculateTotals();
        $this->saveCart();

        return true;
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

        unset($this->cart['items'][$index]);
        $this->cart['items'] = array_values($this->cart['items']);

        $this->recalculateTotals();
        $this->saveCart();

        return true;
    }

    /**
     * Clear cart
     */
    public function clearCart(): void
    {
        $this->cart = [
            'items' => [],
            'location_id' => null,
            'order_type' => null,
            'time_slot_id' => null,
            'customer_address_id' => null,
            'promotion_code' => null,
            'special_instructions' => null,
            'subtotal' => 0,
            'tax_amount' => 0,
            'total_amount' => 0,
            'created_at' => now()->toISOString(),
            'updated_at' => now()->toISOString(),
        ];

        $this->telegramUser->setConversationData('cart', null);

        Log::debug('TelegramCart: Cart cleared', [
            'telegram_user_id' => $this->telegramUser->id,
        ]);
    }

    /**
     * Set order type (pickup/delivery)
     */
    public function setOrderType(string $orderType): void
    {
        $this->cart['order_type'] = $orderType;
        $this->saveCart();
    }

    /**
     * Get order type
     */
    public function getOrderType(): ?string
    {
        return $this->cart['order_type'];
    }

    /**
     * Set location
     */
    public function setLocation(int $locationId): void
    {
        $this->cart['location_id'] = $locationId;
        $this->saveCart();
    }

    /**
     * Get location
     */
    public function getLocationId(): ?int
    {
        return $this->cart['location_id'];
    }

    /**
     * Set time slot
     */
    public function setTimeSlot(int $timeSlotId): void
    {
        $this->cart['time_slot_id'] = $timeSlotId;
        $this->saveCart();
    }

    /**
     * Get time slot
     */
    public function getTimeSlotId(): ?int
    {
        return $this->cart['time_slot_id'];
    }

    /**
     * Set customer address
     */
    public function setCustomerAddress(int $addressId): void
    {
        $this->cart['customer_address_id'] = $addressId;
        $this->saveCart();
    }

    /**
     * Get customer address
     */
    public function getCustomerAddressId(): ?int
    {
        return $this->cart['customer_address_id'];
    }

    /**
     * Set promotion code
     */
    public function setPromotionCode(?string $code): void
    {
        $this->cart['promotion_code'] = $code;
        $this->recalculateTotals();
        $this->saveCart();
    }

    /**
     * Get promotion code
     */
    public function getPromotionCode(): ?string
    {
        return $this->cart['promotion_code'];
    }

    /**
     * Set special instructions
     */
    public function setSpecialInstructions(?string $instructions): void
    {
        $this->cart['special_instructions'] = $instructions;
        $this->saveCart();
    }

    /**
     * Get special instructions
     */
    public function getSpecialInstructions(): ?string
    {
        return $this->cart['special_instructions'];
    }

    /**
     * Get subtotal
     */
    public function getSubtotal(): float
    {
        return (float) ($this->cart['subtotal'] ?? 0);
    }

    /**
     * Get tax amount
     */
    public function getTaxAmount(): float
    {
        return (float) ($this->cart['tax_amount'] ?? 0);
    }

    /**
     * Get total amount
     */
    public function getTotalAmount(): float
    {
        return (float) ($this->cart['total_amount'] ?? 0);
    }

    /**
     * Get cart for order creation
     */
    public function getOrderData(): ?array
    {
        if (empty($this->cart['items'])) {
            return null;
        }

        if (!$this->cart['order_type'] || !$this->cart['location_id']) {
            return null;
        }

        // Build order items
        $orderItems = array_map(function ($item) {
            return [
                'menu_item_id' => $item['menu_item_id'],
                'quantity' => $item['quantity'],
                'special_instructions' => $item['special_instructions'] ?? null,
            ];
        }, $this->cart['items']);

        $data = [
            'order_type' => $this->cart['order_type'],
            'location_id' => $this->cart['location_id'],
            'order_items' => $orderItems,
            'special_instructions' => $this->cart['special_instructions'],
        ];

        // Add time slot if selected
        if ($this->cart['time_slot_id']) {
            $data['time_slot_id'] = $this->cart['time_slot_id'];
        }

        // Add address for delivery
        if ($this->cart['order_type'] === 'delivery' && $this->cart['customer_address_id']) {
            $data['customer_address_id'] = $this->cart['customer_address_id'];
        }

        // Add promotion code
        if ($this->cart['promotion_code']) {
            $data['promotion_code'] = $this->cart['promotion_code'];
        }

        return $data;
    }

    /**
     * Check if cart is valid for checkout
     */
    public function isValidForCheckout(): array
    {
        $errors = [];

        if (empty($this->cart['items'])) {
            $errors[] = 'Your cart is empty';
        }

        if (!$this->cart['order_type']) {
            $errors[] = 'Please select order type (pickup or delivery)';
        }

        if (!$this->cart['location_id']) {
            $errors[] = 'Please select a location';
        }

        if ($this->cart['order_type'] === 'delivery' && !$this->cart['customer_address_id']) {
            $errors[] = 'Please select a delivery address';
        }

        return $errors;
    }

    /**
     * Check if cart is empty
     */
    public function isEmpty(): bool
    {
        return empty($this->cart['items']);
    }

    /**
     * Get cart as array for storage
     */
    public function toArray(): array
    {
        return $this->cart;
    }

    /**
     * Find item index in cart
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
     * Get item quantity in cart
     */
    public function getItemQuantity(int $menuItemId): int
    {
        $index = $this->findItemIndex($menuItemId);

        if ($index === null) {
            return 0;
        }

        return $this->cart['items'][$index]['quantity'] ?? 0;
    }

    /**
     * Get item name from cart
     */
    public function getItemName(int $menuItemId): string
    {
        $index = $this->findItemIndex($menuItemId);

        if ($index === null) {
            return 'Unknown Item';
        }

        return $this->cart['items'][$index]['name'] ?? 'Unknown Item';
    }

    /**
     * Get discount amount
     */
    public function getDiscountAmount(): float
    {
        return (float) ($this->cart['discount_amount'] ?? 0);
    }

    /**
     * Get payment method
     */
    public function getPaymentMethod(): ?string
    {
        return $this->cart['payment_method'] ?? null;
    }

    /**
     * Set payment method
     */
    public function setPaymentMethod(string $method): void
    {
        $this->cart['payment_method'] = $method;
        $this->saveCart();
    }

    /**
     * Recalculate cart totals
     */
    private function recalculateTotals(): void
    {
        $subtotal = 0;

        foreach ($this->cart['items'] as $item) {
            $subtotal += $item['total_price'];
        }

        // Apply promotion if exists
        $discount = 0;
        $promotionCode = $this->cart['promotion_code'];

        if ($promotionCode && $this->telegramUser->customer) {
            $discount = $this->calculateDiscount($promotionCode, $subtotal);
        }

        // Calculate tax (10% default)
        $taxRate = 0.10;
        $taxableBase = max(0, $subtotal - $discount);
        $taxAmount = round($taxableBase * $taxRate, 2);

        // Total
        $total = $taxableBase + $taxAmount;

        $this->cart['subtotal'] = $subtotal;
        $this->cart['discount_amount'] = $discount;
        $this->cart['tax_amount'] = $taxAmount;
        $this->cart['total_amount'] = $total;
    }

    /**
     * Calculate discount
     */
    private function calculateDiscount(string $promotionCode, float $subtotal): float
    {
        $promotion = \App\Models\Promotion::query()
            ->where('code', $promotionCode)
            ->where('is_active', true)
            ->where(function ($q) {
                $now = now();
                $q->whereNull('start_at')->orWhere('start_at', '<=', $now);
            })
            ->where(function ($q) {
                $now = now();
                $q->whereNull('end_at')->orWhere('end_at', '>=', $now);
            })
            ->first();

        if (!$promotion) {
            return 0;
        }

        if (!is_null($promotion->min_order_amount) && $subtotal < (float) $promotion->min_order_amount) {
            return 0;
        }

        return match ($promotion->type) {
            'percentage' => round($subtotal * ((float) $promotion->value / 100), 2),
            'fixed' => min($subtotal, (float) $promotion->value),
            'happy_hour' => round($subtotal * ((float) $promotion->value / 100), 2),
            default => 0,
        };
    }

    /**
     * Convert cart to synced cart items for database
     */
    public function syncToDatabase(Customer $customer): bool
    {
        if (!$customer) {
            return false;
        }

        try {
            DB::transaction(function () use ($customer) {
                // Clear existing cart
                \App\Models\CartItem::where('customer_id', $customer->id)->delete();

                // Add items from Telegram cart
                foreach ($this->cart['items'] as $item) {
                    \App\Models\CartItem::create([
                        'customer_id' => $customer->id,
                        'menu_item_id' => $item['menu_item_id'],
                        'quantity' => $item['quantity'],
                        'special_instructions' => $item['special_instructions'] ?? null,
                    ]);
                }
            });

            return true;
        } catch (\Exception $e) {
            Log::error('TelegramCart: Failed to sync to database', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Load cart from database
     */
    public function loadFromDatabase(Customer $customer): void
    {
        if (!$customer) {
            return;
        }

        $cartItems = \App\Models\CartItem::where('customer_id', $customer->id)
            ->with('menuItem')
            ->get();

        if ($cartItems->isEmpty()) {
            return;
        }

        foreach ($cartItems as $item) {
            $this->cart['items'][] = [
                'menu_item_id' => $item->menu_item_id,
                'name' => $item->menuItem?->name,
                'quantity' => $item->quantity,
                'unit_price' => (float) $item->menuItem?->price,
                'total_price' => (float) $item->menuItem?->price * $item->quantity,
                'special_instructions' => $item->special_instructions,
            ];
        }

        $this->recalculateTotals();
        $this->saveCart();
    }
}

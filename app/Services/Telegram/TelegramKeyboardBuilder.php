<?php

namespace App\Services\Telegram;

use App\Models\Category;
use App\Models\MenuItem;
use App\Models\OrderTimeSlot;
use Illuminate\Support\Collection;

class TelegramKeyboardBuilder
{
    /**
     * Build main menu keyboard
     */
    public static function mainMenu(bool $hasAccount = false, array $userStats = []): array
    {
        $buttons = [
            [
                ['text' => '🍔 Browse Menu', 'callback_data' => 'menu_browse'],
                ['text' => '📦 My Orders', 'callback_data' => 'orders_list'],
            ],
            [
                ['text' => '🛒 Cart', 'callback_data' => 'cart_view'],
                ['text' => '🎁 Rewards', 'callback_data' => 'loyalty_view'],
            ],
            [
                ['text' => '📍 Locations', 'callback_data' => 'locations_list'],
                ['text' => 'ℹ️ Help', 'callback_data' => 'help_show'],
            ],
        ];

        // Add admin link if user has linked account
        if ($hasAccount) {
            $buttons[] = [
                ['text' => '⚙️ Account Settings', 'callback_data' => 'account_settings'],
            ];
        }

        return self::inlineKeyboard($buttons);
    }

    /**
     * Build main menu for unlinked users
     */
    public static function welcomeMenu(): array
    {
        $buttons = [
            [
                ['text' => '📱 Share Phone Number', 'callback_data' => 'auth_phone_request', 'request_contact' => true],
            ],
            [
                ['text' => '📧 Enter Email', 'callback_data' => 'auth_email_request'],
            ],
            [
                ['text' => '🍔 Browse Menu (Guest)', 'callback_data' => 'menu_guest'],
            ],
            [
                ['text' => 'ℹ️ About Us', 'callback_data' => 'about_show'],
            ],
        ];

        return self::replyKeyboard([
            [
                ['text' => '📱 Share Phone', 'request_contact' => true],
                ['text' => '📧 Login with Email'],
            ],
            [
                ['text' => '🍔 Menu'],
                ['text' => '📦 Orders'],
            ],
        ]);
    }

    /**
     * Build welcome keyboard for new users
     */
    public static function welcomeKeyboard(): array
    {
        return [
            'keyboard' => [
                [
                    [
                        'text' => '📱 Share Phone Number',
                        'request_contact' => true,
                    ],
                ],
                [
                    [
                        'text' => '📧 Login with Email',
                    ],
                    [
                        'text' => '🍔 Continue as Guest',
                    ],
                ],
                [
                    [
                        'text' => '📍 Find Locations',
                    ],
                ],
            ],
            'resize_keyboard' => true,
            'one_time_keyboard' => false,
        ];
    }

    /**
     * Build language selection keyboard
     */
    public static function languageSelection(): array
    {
        return [
            'inline_keyboard' => [
                [
                    ['text' => '🇺🇸 English', 'callback_data' => 'lang_en'],
                    ['text' => '🇰🇭 ភាសាខ្មែរ', 'callback_data' => 'lang_km'],
                ],
                [
                    ['text' => '◀️ Back', 'callback_data' => 'auth_start'],
                ],
            ],
        ];
    }

    /**
     * Build account linking progress keyboard
     */
    public static function accountLinkingProgress(string $status): array
    {
        $progressMessages = [
            'phone_shared' => '📱 Phone number received! Looking up your account...',
            'phone_not_found' => '❌ No account found with this phone.',
            'email_sent' => '📧 Verification email sent! Check your inbox.',
            'email_verified' => '✅ Email verified! Account linked.',
            'account_linked' => '✅ Account linked successfully!',
            'registration_sent' => '📝 Registration link sent! Check your email.',
        ];

        $message = $progressMessages[$status] ?? 'Processing...';

        return self::inlineKeyboard([
            [
                ['text' => '⏳ ' . $message, 'callback_data' => 'loading'],
            ],
        ]);
    }

    /**
     * Build categories keyboard with pagination info
     */
    public static function categories(
        Collection $categories,
        int $page = 1,
        int $total = 0,
        int $perPage = 8
    ): array {
        $buttons = [];

        foreach ($categories->chunk(2) as $chunk) {
            $row = [];
            foreach ($chunk as $category) {
                $row[] = [
                    'text' => self::getCategoryEmoji($category->slug) . ' ' . $category->name,
                    'callback_data' => 'category_' . $category->id,
                ];
            }
            $buttons[] = $row;
        }

        // Pagination controls
        $totalPages = max(1, ceil($total / $perPage));
        $paginationRow = [];

        if ($page > 1) {
            $paginationRow[] = ['text' => '◀️ Prev', 'callback_data' => 'category_prev'];
        }

        $paginationRow[] = ['text' => "📄 {$page}/{$totalPages}", 'callback_data' => 'category_page'];

        if ($page < $totalPages) {
            $paginationRow[] = ['text' => 'Next ▶️', 'callback_data' => 'category_next'];
        }

        if (!empty($paginationRow)) {
            $buttons[] = $paginationRow;
        }

        // Add search and navigation buttons
        $buttons[] = [
            ['text' => '🔍 Search', 'callback_data' => 'menu_search'],
            ['text' => '🛒 Cart', 'callback_data' => 'cart_view'],
        ];

        $buttons[] = [
            ['text' => '◀️ Back to Menu', 'callback_data' => 'menu_main'],
        ];

        return self::inlineKeyboard($buttons);
    }

    /**
     * Build menu items keyboard for a category with pagination
     */
    public static function menuItemsWithPagination(
        Collection $items,
        ?string $categoryName = null,
        bool $hasMore = false,
        int $page = 1,
        int $categoryId = 0
    ): array {
        $buttons = [];

        foreach ($items->chunk(2) as $chunk) {
            $row = [];
            foreach ($chunk as $item) {
                $row[] = [
                    'text' => self::formatItemButtonText($item),
                    'callback_data' => 'item_' . $item->id,
                ];
            }
            $buttons[] = $row;
        }

        // Pagination for items
        $paginationRow = [];
        if ($page > 1) {
            $paginationRow[] = ['text' => '◀️ Prev', 'callback_data' => 'items_prev_' . $categoryId];
        }

        $paginationRow[] = ['text' => "📄 {$page}", 'callback_data' => 'items_page'];

        if ($hasMore) {
            $paginationRow[] = ['text' => 'Next ▶️', 'callback_data' => 'items_next_' . $categoryId];
        }

        if (!empty($paginationRow)) {
            $buttons[] = $paginationRow;
        }

        // Quick add row for first few items
        if ($items->count() <= 4) {
            $quickAddRow = [];
            foreach ($items as $item) {
                if (count($quickAddRow) < 3) {
                    $quickAddRow[] = [
                        'text' => '➕ ' . substr($item->name, 0, 15),
                        'callback_data' => 'cart_add_' . $item->id,
                    ];
                }
            }
            if (!empty($quickAddRow)) {
                $buttons[] = $quickAddRow;
            }
        }

        // Navigation
        $buttons[] = [
            ['text' => '◀️ Back to Categories', 'callback_data' => 'menu_categories'],
            ['text' => '🛒 View Cart', 'callback_data' => 'cart_view'],
        ];

        return self::inlineKeyboard($buttons);
    }

    /**
     * Build search results keyboard
     */
    public static function searchResults(Collection $items): array
    {
        $buttons = [];

        foreach ($items->chunk(2) as $chunk) {
            $row = [];
            foreach ($chunk as $item) {
                $price = '$' . number_format($item->price, 2);
                $text = self::getFoodEmoji($item->category?->slug ?? '') . ' ' . substr($item->name, 0, 20) . ' - ' . $price;
                $row[] = [
                    'text' => $text,
                    'callback_data' => 'item_' . $item->id,
                ];
            }
            $buttons[] = $row;
        }

        $buttons[] = [
            ['text' => '🔍 Search Again', 'callback_data' => 'menu_search'],
            ['text' => '◀️ Back to Menu', 'callback_data' => 'menu_browse'],
        ];

        return self::inlineKeyboard($buttons);
    }

    /**
     * Get food emoji based on category
     */
    private static function getFoodEmoji(?string $categorySlug): string
    {
        return self::getCategoryEmoji($categorySlug);
    }

    /**
     * Build item detail keyboard
     */
    public static function itemDetail(MenuItem $item, int $quantity = 1): array
    {
        return self::inlineKeyboard([
            [
                ['text' => '➖', 'callback_data' => 'qty_minus'],
                ['text' => "{$quantity}x", 'callback_data' => 'qty_display'],
                ['text' => '➕', 'callback_data' => 'qty_plus'],
            ],
            [
                ['text' => '🛒 Add to Cart', 'callback_data' => 'cart_add_' . $item->id],
                ['text' => '◀️ Back', 'callback_data' => 'category_back'],
            ],
        ]);
    }

    /**
     * Build cart keyboard with inline controls
     */
    public static function cartWithControls(
        Collection $items,
        float $subtotal,
        float $tax,
        float $discount,
        float $total,
        int $itemCount
    ): array {
        $buttons = [];

        // Cart items with +/- and remove controls
        foreach ($items as $item) {
            $itemId = $item['menu_item_id'];
            $qty = $item['quantity'];
            $name = substr($item['name'], 0, 20);

            $buttons[] = [
                ['text' => '➖', 'callback_data' => "cart_item_{$itemId}_minus"],
                ['text' => "{$qty}x {$name}", 'callback_data' => "cart_item_{$itemId}_view"],
                ['text' => '➕', 'callback_data' => "cart_item_{$itemId}_plus"],
            ];

            $buttons[] = [
                ['text' => '🗑️ Remove', 'callback_data' => "cart_item_{$itemId}_remove"],
                ['text' => '💰 $' . number_format($item['total_price'], 0), 'callback_data' => "cart_item_{$itemId}_view"],
            ];
        }

        // Actions row
        $buttons[] = [
            ['text' => '🛒 Add More', 'callback_data' => 'menu_browse'],
            ['text' => '❌ Clear Cart', 'callback_data' => 'cart_clear'],
        ];

        // Checkout
        $buttons[] = [
            ['text' => '📦 Checkout', 'callback_data' => 'checkout_start'],
        ];

        return self::inlineKeyboard($buttons);
    }

    /**
     * Build confirm clear cart keyboard
     */
    public static function confirmClearCart(): array
    {
        return self::inlineKeyboard([
            [
                ['text' => '✅ Yes, Clear', 'callback_data' => 'cart_confirm_clear'],
                ['text' => '❌ No, Keep', 'callback_data' => 'cart_view'],
            ],
        ]);
    }

    /**
     * Build order type selection keyboard
     */
    public static function orderTypeSelection(): array
    {
        return self::inlineKeyboard([
            [
                ['text' => '🚶 Pickup', 'callback_data' => 'order_type_pickup'],
                ['text' => '🏠 Delivery', 'callback_data' => 'order_type_delivery'],
            ],
            [
                ['text' => '🛒 View Cart', 'callback_data' => 'cart_view'],
            ],
            [
                ['text' => '◀️ Back', 'callback_data' => 'cart_view'],
            ],
        ]);
    }

    /**
     * Alias for orderTypeSelection (backward compatibility)
     */
    public static function orderType(): array
    {
        return self::orderTypeSelection();
    }

    /**
     * Build location selection with details
     */
    public static function locationsWithDetails(Collection $locations): array
    {
        $buttons = [];

        foreach ($locations as $location) {
            $name = $location->name;
            $address = substr($location->address ?? '', 0, 30);
            $hours = $location->opening_hours ?? '10:00-22:00';

            $buttons[] = [
                [
                    'text' => "📍 {$name}",
                    'callback_data' => 'location_' . $location->id,
                ],
                [
                    'text' => "🕐 {$hours}",
                    'callback_data' => 'location_hours_' . $location->id,
                ],
            ];
        }

        $buttons[] = [
            ['text' => '◀️ Back', 'callback_data' => 'order_type_select'],
        ];

        return self::inlineKeyboard($buttons);
    }

    /**
     * Alias for locationsWithDetails (backward compatibility)
     */
    public static function locations(Collection $locations): array
    {
        return self::locationsWithDetails($locations);
    }

    /**
     * Build addresses with default selection
     */
    public static function addressesWithDefault(Collection $addresses, $customer = null): array
    {
        $buttons = [];

        foreach ($addresses as $address) {
            $label = $address->label ?? 'Address';
            $shortAddress = substr($address->address_line_1 ?? '', 0, 35);

            $buttons[] = [
                [
                    'text' => "📍 {$label}",
                    'callback_data' => 'address_' . $address->id,
                ],
                [
                    'text' => "📝 {$shortAddress}",
                    'callback_data' => 'address_view_' . $address->id,
                ],
            ];
        }

        // Add new address button
        $buttons[] = [
            ['text' => '➕ Add New Address', 'callback_data' => 'address_add'],
        ];

        $buttons[] = [
            ['text' => '◀️ Back', 'callback_data' => 'order_type_delivery'],
        ];

        return self::inlineKeyboard($buttons);
    }

    /**
     * Build time slots with date navigation
     */
    public static function timeSlotsWithDates(
        Collection $slots,
        string $dateStr,
        bool $showToday = true,
        bool $showTomorrow = false
    ): array {
        $buttons = [];

        // Date navigation
        $dateRow = [];
        if ($showToday) {
            $dateRow[] = ['text' => '📅 Today', 'callback_data' => 'slots_today'];
        }
        if ($showTomorrow) {
            $dateRow[] = ['text' => '📅 Tomorrow', 'callback_data' => 'slots_tomorrow'];
        }
        if (!empty($dateRow)) {
            $buttons[] = $dateRow;
        }

        // Time slots in rows of 3
        foreach ($slots->chunk(3) as $chunk) {
            $row = [];
            foreach ($chunk as $slot) {
                $startTime = substr($slot['start'] ?? '', 0, 5);
                $row[] = [
                    'text' => $startTime,
                    'callback_data' => 'slot_' . $slot['id'],
                ];
            }
            $buttons[] = $row;
        }

        $buttons[] = [
            ['text' => '◀️ Back', 'callback_data' => 'checkout_back'],
        ];

        return self::inlineKeyboard($buttons);
    }

    /**
     * Alias for timeSlotsWithDates (backward compatibility)
     */
    public static function timeSlots(
        Collection $slots,
        string $dateStr,
        bool $showToday = true,
        bool $showTomorrow = false
    ): array {
        return self::timeSlotsWithDates($slots, $dateStr, $showToday, $showTomorrow);
    }

    /**
     * Build time slot date navigation
     */
    public static function timeSlotDateNavigation(string $currentDate): array
    {
        $buttons = [];

        if ($currentDate === 'today') {
            $buttons[] = [
                ['text' => '📅 Tomorrow', 'callback_data' => 'slots_tomorrow'],
            ];
        }

        $buttons[] = [
            ['text' => '◀️ Back', 'callback_data' => 'checkout_back'],
        ];

        return self::inlineKeyboard($buttons);
    }

    /**
     * Build payment methods with Bakong option
     */
    public static function paymentMethodsWithBakong(float $total): array
    {
        $buttons = [];

        // Bakong option
        $buttons[] = [
            ['text' => '🔵 Bakong KHQR', 'callback_data' => 'payment_bakong'],
        ];

        // Cash payment
        $paymentText = '💵 Pay on ' . ($total > 0 ? 'Pickup/Delivery' : 'Arrival');
        $buttons[] = [
            ['text' => $paymentText, 'callback_data' => 'payment_cash'],
        ];

        $buttons[] = [
            ['text' => '◀️ Back', 'callback_data' => 'checkout_back'],
        ];

        return self::inlineKeyboard($buttons);
    }

    /**
     * Alias for paymentMethodsWithBakong (backward compatibility)
     */
    public static function paymentMethods(bool $onlineAvailable = false): array
    {
        $buttons = [];

        if ($onlineAvailable) {
            $buttons[] = [
                ['text' => '💳 Pay Online', 'callback_data' => 'payment_online'],
            ];
        }

        $buttons[] = [
            ['text' => '💵 Pay on Pickup/Delivery', 'callback_data' => 'payment_cash'],
        ];

        $buttons[] = [
            ['text' => '◀️ Back', 'callback_data' => 'checkout_back'],
        ];

        return self::inlineKeyboard($buttons);
    }

    /**
     * Build Bakong payment keyboard
     */
    public static function bakongPayment(array $data): array
    {
        return self::inlineKeyboard([
            [
                ['text' => '✅ I\'ve Paid', 'callback_data' => 'payment_bakong_confirm'],
            ],
            [
                ['text' => '🔄 Check Status', 'callback_data' => 'payment_bakong_check'],
            ],
            [
                ['text' => '💵 Pay with Cash Instead', 'callback_data' => 'payment_cash'],
            ],
            [
                ['text' => '◀️ Back', 'callback_data' => 'checkout_back'],
            ],
        ]);
    }

    /**
     * Build order confirmation with edit option
     */
    public static function orderConfirmationWithEdit(): array
    {
        return self::inlineKeyboard([
            [
                ['text' => '✅ Confirm Order', 'callback_data' => 'order_confirm'],
                ['text' => '✏️ Edit Cart', 'callback_data' => 'order_edit'],
            ],
            [
                ['text' => '❌ Cancel', 'callback_data' => 'order_cancel'],
            ],
        ]);
    }

    /**
     * Build order placed confirmation
     */
    public static function orderPlacedConfirmation(string $orderNumber): array
    {
        return self::inlineKeyboard([
            [
                ['text' => '📋 View Order', 'callback_data' => 'order_detail_new'],
                ['text' => '🔔 Enable Notifications', 'callback_data' => 'orders_enable_notifications'],
            ],
            [
                ['text' => '🍔 Order More', 'callback_data' => 'menu_browse'],
                ['text' => '◀️ Main Menu', 'callback_data' => 'menu_main'],
            ],
        ]);
    }

    /**
     * Build order confirmation keyboard
     */
    public static function orderConfirmation(string $orderNumber): array
    {
        return self::inlineKeyboard([
            [
                ['text' => '✅ Confirm Order', 'callback_data' => 'order_confirm'],
                ['text' => '✏️ Edit Order', 'callback_data' => 'order_edit'],
            ],
            [
                ['text' => '❌ Cancel', 'callback_data' => 'order_cancel'],
            ],
        ]);
    }

    /**
     * Build order list keyboard
     */
    public static function orderList(Collection $orders): array
    {
        $buttons = [];

        foreach ($orders as $order) {
            $statusEmoji = self::getStatusEmoji($order->status);
            $date = $order->ordered_at?->format('M j');
            $total = '$' . number_format($order->total_amount, 2);

            $buttons[] = [
                [
                    'text' => "{$statusEmoji} {$order->order_number} - {$date} ({$total})",
                    'callback_data' => 'order_detail_' . $order->id,
                ],
            ];
        }

        $buttons[] = [
            ['text' => '◀️ Back to Menu', 'callback_data' => 'menu_main'],
        ];

        return self::inlineKeyboard($buttons);
    }

    /**
     * Build order detail keyboard
     */
    public static function orderDetail(Order $order): array
    {
        $buttons = [];

        // Reorder button if completed
        if (in_array($order->status, ['completed', 'delivered'])) {
            $buttons[] = [
                ['text' => '🔄 Reorder', 'callback_data' => 'order_reorder_' . $order->id],
            ];
        }

        // Track button if not completed/cancelled
        if (!in_array($order->status, ['completed', 'delivered', 'cancelled'])) {
            $buttons[] = [
                ['text' => '🔔 Track Status', 'callback_data' => 'order_track_' . $order->id],
            ];
        }

        // Cancel button if can be cancelled
        if ($order->can_cancel) {
            $buttons[] = [
                ['text' => '❌ Cancel Order', 'callback_data' => 'order_cancel_request_' . $order->id],
            ];
        }

        $buttons[] = [
            ['text' => '◀️ Back to Orders', 'callback_data' => 'orders_list'],
            ['text' => '🏠 Main Menu', 'callback_data' => 'menu_main'],
        ];

        return self::inlineKeyboard($buttons);
    }

    /**
     * Build order list with pagination
     */
    public static function orderListWithPagination(Collection $orders, int $page, int $totalPages): array
    {
        $buttons = [];

        foreach ($orders as $order) {
            $statusEmoji = self::getStatusEmoji($order->status);
            $date = $order->created_at?->format('M j');
            $total = '$' . number_format($order->total_amount, 2);
            $type = $order->order_type === 'pickup' ? '🚶' : '🏠';

            $buttons[] = [
                [
                    'text' => "{$statusEmoji} {$type} #{$order->order_number}",
                    'callback_data' => 'order_detail_' . $order->id,
                ],
                [
                    'text' => "{$date} - {$total}",
                    'callback_data' => 'order_detail_' . $order->id,
                ],
            ];
        }

        // Pagination
        $paginationRow = [];
        if ($page > 1) {
            $paginationRow[] = ['text' => '◀️ Prev', 'callback_data' => 'orders_page_' . ($page - 1)];
        }
        $paginationRow[] = ['text' => "📄 {$page}/{$totalPages}", 'callback_data' => 'orders_page_' . $page];
        if ($page < $totalPages) {
            $paginationRow[] = ['text' => 'Next ▶️', 'callback_data' => 'orders_page_' . ($page + 1)];
        }
        if (!empty($paginationRow)) {
            $buttons[] = $paginationRow;
        }

        $buttons[] = [
            ['text' => '🍔 Browse Menu', 'callback_data' => 'menu_browse'],
            ['text' => '🏠 Main Menu', 'callback_data' => 'menu_main'],
        ];

        return self::inlineKeyboard($buttons);
    }

    /**
     * Build order detail actions
     */
    public static function orderDetailActions(Order $order): array
    {
        $buttons = [];

        // Reorder button if completed
        if (in_array($order->status, ['completed', 'delivered'])) {
            $buttons[] = [
                ['text' => '🔄 Order Again', 'callback_data' => 'order_reorder_' . $order->id],
            ];
        }

        // Track button if not completed/cancelled
        if (!in_array($order->status, ['completed', 'delivered', 'cancelled'])) {
            $buttons[] = [
                ['text' => '📍 Track Order', 'callback_data' => 'order_track_' . $order->id],
            ];
        }

        // Cancel button if can be cancelled
        if ($order->can_cancel) {
            $buttons[] = [
                ['text' => '❌ Cancel Order', 'callback_data' => 'order_cancel_request_' . $order->id],
            ];
        }

        $buttons[] = [
            ['text' => '◀️ All Orders', 'callback_data' => 'orders_list'],
        ];

        return self::inlineKeyboard($buttons);
    }

    /**
     * Build order tracking actions
     */
    public static function orderTrackingActions(Order $order): array
    {
        $buttons = [];

        $buttons[] = [
            ['text' => '📋 View Details', 'callback_data' => 'order_detail_' . $order->id],
        ];

        if ($order->can_cancel) {
            $buttons[] = [
                ['text' => '❌ Cancel Order', 'callback_data' => 'order_cancel_request_' . $order->id],
            ];
        }

        $buttons[] = [
            ['text' => '◀️ Back to Orders', 'callback_data' => 'orders_list'],
            ['text' => '🏠 Main Menu', 'callback_data' => 'menu_main'],
        ];

        return self::inlineKeyboard($buttons);
    }

    /**
     * Build confirm cancel order keyboard
     */
    public static function confirmCancelOrder(): array
    {
        return self::inlineKeyboard([
            [
                ['text' => '✅ Yes, Cancel', 'callback_data' => 'order_cancel_confirm'],
                ['text' => '❌ No, Keep', 'callback_data' => 'order_detail_back'],
            ],
        ]);
    }

    /**
     * Build loyalty status keyboard
     */
    public static function loyaltyStatus(array $stats): array
    {
        return self::inlineKeyboard([
            [
                ['text' => "⭐ Points: {$stats['points']}", 'callback_data' => 'loyalty_points'],
                ['text' => "🏆 Tier: {$stats['tier']}", 'callback_data' => 'loyalty_tier'],
            ],
            [
                ['text' => '📜 Points History', 'callback_data' => 'loyalty_history'],
                ['text' => '🎁 Available Rewards', 'callback_data' => 'loyalty_rewards'],
            ],
            [
                ['text' => '◀️ Back', 'callback_data' => 'menu_main'],
            ],
        ]);
    }

    /**
     * Build help keyboard
     */
    public static function helpMenu(): array
    {
        return self::inlineKeyboard([
            [
                ['text' => '📖 How to Order', 'callback_data' => 'help_ordering'],
                ['text' => '💳 Payment Methods', 'callback_data' => 'help_payment'],
            ],
            [
                ['text' => '🚚 Delivery Info', 'callback_data' => 'help_delivery'],
                ['text' => '🎁 Loyalty Program', 'callback_data' => 'help_loyalty'],
            ],
            [
                ['text' => '📞 Contact Us', 'callback_data' => 'help_contact'],
                ['text' => '◀️ Back', 'callback_data' => 'menu_main'],
            ],
        ]);
    }

    /**
     * Build address selection for delivery
     */
    public static function addresses(Collection $addresses, int $locationId): array
    {
        $buttons = [];

        foreach ($addresses as $address) {
            $label = $address->label ?? 'Address';
            $text = "📍 {$label}: " . substr($address->address_line_1, 0, 30) . '...';
            $buttons[] = [
                ['text' => $text, 'callback_data' => 'address_' . $address->id],
            ];
        }

        $buttons[] = [
            ['text' => '+ Add New Address', 'callback_data' => 'address_add'],
        ];

        $buttons[] = [
            ['text' => '◀️ Back', 'callback_data' => 'checkout_order_type'],
        ];

        return self::inlineKeyboard($buttons);
    }

    /**
     * Build quantity adjustment keyboard
     */
    public static function quantityControl(int $quantity, int $menuItemId): array
    {
        return self::inlineKeyboard([
            [
                ['text' => '➖', 'callback_data' => 'qty_minus_' . $menuItemId],
                ['text' => "{$quantity}", 'callback_data' => 'qty_current'],
                ['text' => '➕', 'callback_data' => 'qty_plus_' . $menuItemId],
            ],
            [
                ['text' => '🛒 Add to Cart', 'callback_data' => 'cart_add_' . $menuItemId],
                ['text' => '◀️ Back', 'callback_data' => 'menu_categories'],
            ],
        ]);
    }

    /**
     * Build loading/processing keyboard (single button)
     */
    public static function loading(string $message = 'Processing...'): array
    {
        return self::inlineKeyboard([
            [
                ['text' => '⏳ ' . $message, 'callback_data' => 'loading'],
            ],
        ]);
    }

    /**
     * Build empty cart keyboard
     */
    public static function emptyCart(): array
    {
        return self::inlineKeyboard([
            [
                ['text' => '🍔 Browse Menu', 'callback_data' => 'menu_categories'],
            ],
            [
                ['text' => '◀️ Back to Menu', 'callback_data' => 'menu_main'],
            ],
        ]);
    }

    // ============================================
    // Helper Methods
    // ============================================

    /**
     * Create inline keyboard
     */
    public static function inlineKeyboard(array $buttons): array
    {
        return [
            'inline_keyboard' => $buttons,
        ];
    }

    /**
     * Create reply keyboard
     */
    public static function replyKeyboard(array $buttons, bool $resize = true, bool $oneTime = false): array
    {
        return [
            'keyboard' => $buttons,
            'resize_keyboard' => $resize,
            'one_time_keyboard' => $oneTime,
        ];
    }

    /**
     * Remove reply keyboard
     */
    public static function removeKeyboard(): array
    {
        return [
            'remove_keyboard' => true,
        ];
    }

    /**
     * Get category emoji
     */
    public static function getCategoryEmoji(?string $slug): string
    {
        return match ($slug) {
            'pizza', 'pizzas' => '🍕',
            'burger', 'burgers' => '🍔',
            'noodle', 'noodles', 'pasta' => '🍜',
            'rice', 'fried-rice' => '🍚',
            'salad', 'salads' => '🥗',
            'drink', 'drinks', 'beverage', 'beverages' => '🍹',
            'dessert', 'desserts', 'cake', 'cakes' => '🍰',
            'appetizer', 'appetizers', 'starter', 'starters' => '🥟',
            'soup', 'soups' => '🍲',
            'seafood', 'fish', 'shrimp' => '🦐',
            'chicken', 'poultry' => '🍗',
            'beef', 'meat' => '🥩',
            'vegetarian', 'vegan' => '🥬',
            'combo', 'combo-meal', 'set' => '🍱',
            'side', 'sides' => '🍟',
            default => '🍽️',
        };
    }

    /**
     * Get status emoji
     */
    private static function getStatusEmoji(string $status): string
    {
        return match ($status) {
            'pending' => '⏳',
            'received' => '✅',
            'preparing' => '👨‍🍳',
            'ready' => '🔔',
            'completed' => '⭐',
            'cancelled' => '🚫',
            'out_for_delivery' => '🚗',
            'delivered' => '📦',
            default => '📋',
        };
    }

    /**
     * Format item button text
     */
    private static function formatItemButtonText(MenuItem $item): string
    {
        $name = $item->name ?? $item->slug;
        $price = '$' . number_format($item->price, 2);

        // Truncate long names
        if (strlen($name) > 25) {
            $name = substr($name, 0, 22) . '...';
        }

        return "{$name} - {$price}";
    }

    /**
     * Create a URL button
     */
    public static function urlButton(string $text, string $url): array
    {
        return [
            'text' => $text,
            'url' => $url,
        ];
    }

    /**
     * Create a login button
     */
    public static function loginButton(string $url): array
    {
        return [
            'text' => '🔐 Login',
            'login_url' => [
                'url' => $url,
                'forward_text' => 'Login to NKH Restaurant',
            ],
        ];
    }

    /**
     * Create switch inline query button
     */
    public static function switchInlineQuery(string $text, string $query = ''): array
    {
        return [
            'text' => $text,
            'switch_inline_query' => $query,
        ];
    }

    /**
     * Create switch inline query current chat button
     */
    public static function switchInlineQueryCurrentChat(string $text, string $query = ''): array
    {
        return [
            'text' => $text,
            'switch_inline_query_current_chat' => $query,
        ];
    }

    /**
     * Build order status keyboard for notifications
     */
    public static function buildOrderStatusKeyboard(int $orderId): array
    {
        return self::inlineKeyboard([
            [
                ['text' => '📍 Track Order', 'callback_data' => 'order_track_' . $orderId],
                ['text' => '📋 View Details', 'callback_data' => 'order_detail_' . $orderId],
            ],
            [
                ['text' => '🔄 Enable Notifications', 'callback_data' => 'orders_enable_notifications'],
            ],
            [
                ['text' => '🏠 Main Menu', 'callback_data' => 'menu_main'],
            ],
        ]);
    }

    /**
     * Build order completed keyboard
     */
    public static function buildOrderCompletedKeyboard(int $orderId): array
    {
        return self::inlineKeyboard([
            [
                ['text' => '⭐ Rate Order', 'callback_data' => 'order_rate_' . $orderId],
                ['text' => '🔄 Order Again', 'callback_data' => 'order_reorder_' . $orderId],
            ],
            [
                ['text' => '📦 View All Orders', 'callback_data' => 'orders_list'],
                ['text' => '🏠 Main Menu', 'callback_data' => 'menu_main'],
            ],
        ]);
    }

    /**
     * Build track order keyboard
     */
    public static function buildTrackOrderKeyboard(int $orderId): array
    {
        return self::inlineKeyboard([
            [
                ['text' => '📍 Track Live', 'callback_data' => 'order_track_' . $orderId],
                ['text' => '📋 View Details', 'callback_data' => 'order_detail_' . $orderId],
            ],
            [
                ['text' => '🏠 Main Menu', 'callback_data' => 'menu_main'],
            ],
        ]);
    }

    /**
     * Build notification preference keyboard
     */
    public static function buildNotificationPreferenceKeyboard(): array
    {
        return self::inlineKeyboard([
            [
                ['text' => '🔔 Enable All Notifications', 'callback_data' => 'notif_enable_all'],
                ['text' => '📊 Status Updates Only', 'callback_data' => 'notif_status_only'],
            ],
            [
                ['text' => '🔕 Disable Notifications', 'callback_data' => 'notif_disable'],
            ],
            [
                ['text' => '◀️ Back', 'callback_data' => 'menu_main'],
            ],
        ]);
    }
}

<?php

namespace App\Services\Telegram;

use App\Models\Customer;
use App\Models\Order;
use App\Models\TelegramUser;
use App\Models\Location;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Telegram Admin Service
 *
 * Provides admin functionality accessible via Telegram bot including:
 * - Dashboard with real-time stats
 * - Order management
 * - Sales analytics
 * - Customer lookup
 */
class TelegramAdminService
{
    private TelegramBotService $botService;
    private array $adminTelegramIds;

    public function __construct(TelegramBotService $botService)
    {
        $this->botService = $botService;
        // Load admin IDs from config or environment
        $this->adminTelegramIds = config('telegram.admin_ids', []);
    }

    /**
     * Check if telegram ID is admin
     */
    public function isAdmin(int $telegramId): bool
    {
        return in_array($telegramId, $this->adminTelegramIds, true);
    }

    /**
     * Get admin dashboard message
     */
    public function getDashboardMessage(int $telegramId): array
    {
        if (!$this->isAdmin($telegramId)) {
            return $this->getUnauthorizedMessage();
        }

        $stats = $this->getDailyStats(Carbon::today());

        $message = "📊 Admin Dashboard\n";
        $message .= "━━━━━━━━━━━━━━━━━━━━━\n\n";

        // Orders overview
        $message .= "📦 Today's Orders\n";
        $message .= "│ Total: {$stats['total_orders']}\n";
        $message .= "│ Pending: {$stats['pending_orders']}\n";
        $message .= "│ Preparing: {$stats['preparing_orders']}\n";
        $message .= "│ Completed: {$stats['completed_orders']}\n\n";

        // Revenue
        $message .= "💰 Revenue\n";
        $message .= "│ Today: $" . number_format($stats['revenue'], 0) . "\n";
        $message .= "│ Average Order: $" . number_format($stats['avg_order_value'], 0) . "\n\n";

        // Other metrics
        $message .= "📊 Other Metrics\n";
        $message .= "│ New Customers: {$stats['new_customers']}\n";
        $message .= "│ Active Locations: {$stats['active_locations']}\n\n";

        $message .= "━━━━━━━━━━━━━━━━━━━━━\n";
        $message .= "📝 Pending Actions\n";

        if ($stats['pending_orders'] > 0) {
            $message .= "• {$stats['pending_orders']} orders awaiting approval\n";
        }
        if ($stats['preparing_orders'] > 0) {
            $message .= "• {$stats['preparing_orders']} orders being prepared\n";
        }
        if ($stats['ready_orders'] > 0) {
            $message .= "• {$stats['ready_orders']} orders ready for pickup\n";
        }

        if ($stats['pending_orders'] === 0 && $stats['preparing_orders'] === 0 && $stats['ready_orders'] === 0) {
            $message .= "• No pending actions\n";
        }

        $keyboard = $this->buildDashboardKeyboard($stats);

        return [
            'message' => $message,
            'keyboard' => $keyboard,
        ];
    }

    /**
     * Get daily statistics
     */
    public function getDailyStats(Carbon $date): array
    {
        $startOfDay = $date->copy()->startOfDay();
        $endOfDay = $date->copy()->endOfDay();

        $orders = Order::whereBetween('orders.created_at', [$startOfDay, $endOfDay])
            ->leftJoin('order_statuses', 'orders.order_status_id', '=', 'order_statuses.id')
            ->selectRaw('
                COUNT(*) as total_orders,
                SUM(CASE WHEN order_statuses.code = "pending" THEN 1 ELSE 0 END) as pending_orders,
                SUM(CASE WHEN order_statuses.code = "received" THEN 1 ELSE 0 END) as received_orders,
                SUM(CASE WHEN order_statuses.code = "preparing" THEN 1 ELSE 0 END) as preparing_orders,
                SUM(CASE WHEN order_statuses.code = "ready" THEN 1 ELSE 0 END) as ready_orders,
                SUM(CASE WHEN order_statuses.code = "completed" THEN 1 ELSE 0 END) as completed_orders,
                SUM(CASE WHEN order_statuses.code = "cancelled" THEN 1 ELSE 0 END) as cancelled_orders,
                COALESCE(SUM(total_amount), 0) as revenue
            ')
            ->first();

        $avgOrderValue = $orders->total_orders > 0
            ? $orders->revenue / $orders->total_orders
            : 0;

        $newCustomers = User::whereBetween('created_at', [$startOfDay, $endOfDay])
            ->whereHas('roles', fn($q) => $q->where('name', 'customer'))
            ->count();

        $activeLocations = Location::where('is_active', true)->count();

        return [
            'total_orders' => (int) $orders->total_orders,
            'pending_orders' => (int) $orders->pending_orders,
            'received_orders' => (int) $orders->received_orders,
            'preparing_orders' => (int) $orders->preparing_orders,
            'ready_orders' => (int) $orders->ready_orders,
            'completed_orders' => (int) $orders->completed_orders,
            'cancelled_orders' => (int) $orders->cancelled_orders,
            'revenue' => (float) $orders->revenue,
            'avg_order_value' => (float) $avgOrderValue,
            'new_customers' => $newCustomers,
            'active_locations' => $activeLocations,
        ];
    }

    /**
     * Get pending orders list
     */
    public function getPendingOrdersMessage(int $telegramId, int $page = 1): array
    {
        if (!$this->isAdmin($telegramId)) {
            return $this->getUnauthorizedMessage();
        }

        $perPage = 10;
        $offset = ($page - 1) * $perPage;

        $orders = Order::whereHas('orderStatus', fn($q) => $q->whereIn('code', ['pending', 'received']))
            ->with(['customer', 'location', 'items'])
            ->orderBy('created_at', 'asc')
            ->skip($offset)
            ->take($perPage)
            ->get();

        $totalCount = Order::whereHas('orderStatus', fn($q) => $q->whereIn('code', ['pending', 'received']))->count();
        $totalPages = ceil($totalCount / $perPage);

        if ($orders->isEmpty()) {
            $message = "📦 Pending Orders\n\n";
            $message .= "No pending orders at the moment.";

            return [
                'message' => $message,
                'keyboard' => [
                    [['text' => '◀️ Back to Dashboard', 'callback_data' => 'admin_dashboard']],
                ],
            ];
        }

        $message = "📦 Pending Orders\n";
        $message .= "━━━━━━━━━━━━━━━━━━━━━\n\n";
        $message .= "_Page {$page} of {$totalPages} ({$totalCount} orders)_\n\n";

        foreach ($orders as $index => $order) {
            $num = $offset + $index + 1;
            $statusIcon = match ($order->status) {
                'pending' => '⏳',
                'received' => '✅',
                default => '📊',
            };

            $message .= "{$num}. {$statusIcon} Order #{$order->id}\n";
            $locationName = $order->location->name ?? 'N/A';
            $customerName = $order->customer->name ?? 'Guest';
            $message .= "   " . "\xF0\x9F\x93\x8D" . " {$locationName}\n";
            $message .= "   " . "\xF0\x9F\x91\xA4" . " {$customerName}\n";
            $message .= "   " . "\xF0\x9F\x92\xB0" . " \${$order->total_amount}\n";
            $message .= "   " . "\xF0\x9F\x95\x90" . " " . $order->created_at->format('H:i') . "\n\n";
        }

        $keyboard = $this->buildPendingOrdersKeyboard($orders, $page, $totalPages);

        return [
            'message' => $message,
            'keyboard' => $keyboard,
        ];
    }

    /**
     * Get order detail for admin
     */
    public function getOrderDetailMessage(int $telegramId, int $orderId): array
    {
        if (!$this->isAdmin($telegramId)) {
            return $this->getUnauthorizedMessage();
        }

        $order = Order::with(['customer', 'location', 'timeSlot', 'items.menuItem'])
            ->find($orderId);

        if (!$order) {
            $message = "❌ Order Not Found\n\n";
            $message .= "Order #{$orderId} does not exist.";

            return [
                'message' => $message,
                'keyboard' => [
                    [['text' => '◀️ Back to Orders', 'callback_data' => 'admin_pending_orders']],
                ],
            ];
        }

        $statusIcon = $this->getStatusIcon($order->status);
        $typeIcon = $order->order_type_code === 'delivery' ? '🚗' : '🏪';

        $message = "📋 Order #{$order->order_number}\n";
        $message .= "━━━━━━━━━━━━━━━━━━━\n\n";

        // Status and type
        $message .= "{$statusIcon} Status: {$order->status}\n";
        $message .= "{$typeIcon} Type: " . ucfirst($order->order_type_code) . "\n\n";

        // Customer info
        $customerName = $order->customer->name ?? 'N/A';
        $customerPhone = $order->customer->user->phone ?? 'N/A';
        $message .= "\xF0\x9F\x91\xA4 Customer\n";
        $message .= "| Name: {$customerName}\n";
        $message .= "| Phone: {$customerPhone}\n\n";

        // Location and time
        $locationName = $order->location->name ?? 'N/A';
        $message .= "\xF0\x9F\x93\x8D Location\n";
        $message .= "| {$locationName}\n\n";

        if ($order->pickup_time) {
            $message .= "\xF0\x9F\x95\x90 Pickup Time\n";
            $message .= "| " . $order->pickup_time->format('M j, g:i A') . "\n\n";
        }

        // Items
        $message .= "\xF0\x9F\x9B\x92 Items\n";
        foreach ($order->items as $item) {
            $itemName = $item->menuItem->name ?? 'Unknown';
            $message .= "- {$itemName} x {$item->quantity}\n";
            $message .= "  \$" . number_format($item->unit_price, 2) . " × {$item->quantity} = \$" . number_format($item->subtotal, 2) . "\n";
        }
        $message .= "\n";

        // Totals
        $message .= "\xF0\x9F\x92\xB0 Totals\n";
        $message .= "| Subtotal: \$" . number_format($order->subtotal, 2) . "\n";
        if ($order->discount_amount > 0) {
            $message .= "│ Discount: -\$" . number_format($order->discount_amount, 2) . "\n";
        }
        $message .= "│ Tax: \$" . number_format($order->tax_amount, 2) . "\n";
        $message .= "│ Total: \$" . number_format($order->total_amount, 2) . "*\n\n";

        // Payment
        $message .= "💳 Payment\n";
        $message .= "│ Method: " . str_replace('_', ' ', $order->payment_mode) . "\n";
        $message .= "│ Status: " . ucfirst($order->payment_status) . "\n\n";

        // Special instructions
        if ($order->special_instructions) {
            $message .= "📝 Special Instructions\n";
            $message .= "_{$order->special_instructions}_\n\n";
        }

        $message .= "━━━━━━━━━━━━━━━━━━━━━";
        $message .= "\n🕐 Created: " . $order->created_at->format('M j, H:i');
        if ($order->updated_at != $order->created_at) {
            $message .= "\n🕐 Updated: " . $order->updated_at->format('M j, H:i');
        }

        $keyboard = $this->buildOrderManagementKeyboard($order);

        return [
            'message' => $message,
            'keyboard' => $keyboard,
        ];
    }

    /**
     * Update order status
     */
    public function updateOrderStatus(int $telegramId, int $orderId, string $status): bool
    {
        if (!$this->isAdmin($telegramId)) {
            return false;
        }

        $order = Order::find($orderId);
        if (!$order) {
            return false;
        }

        try {
            $order->status = $status;
            $order->save();

            // Notify customer via Telegram
            $telegramUser = TelegramUser::where('customer_id', $order->customer_id)->first();
            if ($telegramUser && $telegramUser->notifications_enabled) {
                $notificationService = app(TelegramOrderNotificationService::class);
                $notificationService->sendStatusNotification($order, $status, $telegramUser);
            }

            Log::info('Admin updated order status via Telegram', [
                'admin_id' => $telegramId,
                'order_id' => $orderId,
                'status' => $status,
            ]);

            return true;
        } catch (Throwable $e) {
            Log::error('Failed to update order status via Telegram', [
                'admin_id' => $telegramId,
                'order_id' => $orderId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Get status icon
     */
    private function getStatusIcon(string $status): string
    {
        return match ($status) {
            'pending' => '⏳',
            'received' => '✅',
            'preparing' => '👨‍🍳',
            'ready' => '🔔',
            'out_for_delivery' => '🚗',
            'completed' => '⭐',
            'cancelled' => '❌',
            default => '📊',
        };
    }

    /**
     * Get unauthorized message
     */
    private function getUnauthorizedMessage(): array
    {
        return [
            'message' => "🔒 Access Denied\n\nYou don't have permission to access admin features.",
            'keyboard' => [
                [['text' => '🏠 Main Menu', 'callback_data' => 'menu_main']],
            ],
        ];
    }

    /**
     * Build dashboard keyboard
     */
    private function buildDashboardKeyboard(array $stats): array
    {
        $keyboard = [];

        // Quick actions
        if ($stats['pending_orders'] > 0) {
            $keyboard[] = [
                ['text' => "📦 Pending ({$stats['pending_orders']})", 'callback_data' => 'admin_pending_orders'],
                ['text' => "👨‍🍳 Preparing ({$stats['preparing_orders']})", 'callback_data' => 'admin_preparing_orders'],
            ];
        }

        $keyboard[] = [
            ['text' => '📊 Analytics', 'callback_data' => 'admin_analytics_today'],
            ['text' => '📋 Orders', 'callback_data' => 'admin_pending_orders'],
        ];

        $keyboard[] = [
            ['text' => '📍 Locations', 'callback_data' => 'admin_locations'],
            ['text' => '👥 Customers', 'callback_data' => 'admin_customers'],
        ];

        // Refresh
        $keyboard[] = [
            ['text' => '🔄 Refresh', 'callback_data' => 'admin_dashboard'],
        ];

        return $keyboard;
    }

    /**
     * Build pending orders keyboard
     */
    private function buildPendingOrdersKeyboard($orders, int $page, int $totalPages): array
    {
        $keyboard = [];

        // Order buttons
        foreach ($orders as $order) {
            $statusIcon = match ($order->status) {
                'pending' => '⏳',
                'received' => '✅',
                default => '📊',
            };

            $label = "#{$order->id} - $" . number_format($order->total_amount, 0);
            $keyboard[] = [
                ['text' => "{$statusIcon} {$label}", 'callback_data' => "admin_order_detail_{$order->id}"],
            ];
        }

        // Pagination
        $navRow = [];
        if ($page > 1) {
            $navRow[] = ['text' => '◀️ Previous', 'callback_data' => "admin_pending_page_" . ($page - 1)];
        }
        $navRow[] = ['text' => "Page {$page}/{$totalPages}", 'callback_data' => 'admin_page_info'];
        if ($page < $totalPages) {
            $navRow[] = ['text' => 'Next ▶️', 'callback_data' => "admin_pending_page_" . ($page + 1)];
        }
        $keyboard[] = $navRow;

        // Back
        $keyboard[] = [
            ['text' => '🏠 Dashboard', 'callback_data' => 'admin_dashboard'],
        ];

        return $keyboard;
    }

    /**
     * Build order management keyboard
     */
    private function buildOrderManagementKeyboard(Order $order): array
    {
        $keyboard = [];

        // Status actions based on current status
        $statusActions = match ($order->status) {
            'pending' => [
                ['text' => '✅ Approve', 'callback_data' => "admin_order_{$order->id}_approve"],
                ['text' => '❌ Decline', 'callback_data' => "admin_order_{$order->id}_decline"],
            ],
            'received' => [
                ['text' => '👨‍🍳 Start Preparing', 'callback_data' => "admin_order_{$order->id}_preparing"],
            ],
            'preparing' => [
                ['text' => '🔔 Mark Ready', 'callback_data' => "admin_order_{$order->id}_ready"],
            ],
            'ready' => [
                ['text' => '🚗 Out for Delivery', 'callback_data' => "admin_order_{$order->id}_out"],
                ['text' => '⭐ Complete', 'callback_data' => "admin_order_{$order->id}_complete"],
            ],
            'out_for_delivery' => [
                ['text' => '⭐ Complete', 'callback_data' => "admin_order_{$order->id}_complete"],
            ],
            default => [],
        };

        foreach ($statusActions as $actions) {
            $keyboard[] = $actions;
        }

        // Additional actions
        $keyboard[] = [
            ['text' => '📞 Call Customer', 'callback_data' => "admin_order_{$order->id}_call"],
            ['text' => '📍 View Location', 'callback_data' => "admin_order_{$order->id}_location"],
        ];

        // Back
        $keyboard[] = [
            ['text' => '◀️ Back to Orders', 'callback_data' => 'admin_pending_orders'],
        ];

        return $keyboard;
    }
}

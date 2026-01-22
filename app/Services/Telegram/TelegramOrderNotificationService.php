<?php

namespace App\Services\Telegram;

use App\Jobs\TelegramNotificationRetryJob;
use App\Models\Order;
use App\Models\TelegramOrderNotification;
use App\Models\TelegramUser;
use App\Models\UserNotification;

class TelegramOrderNotificationService
{
    private TelegramBotService $botService;
    private TelegramKeyboardBuilder $keyboardBuilder;


    // Status mapping for notification messages
    private const STATUS_MESSAGES = [
        'placed' => [
            'title' => '📋 Order Placed',
            'emoji' => '✅',
            'message' => 'Your order has been placed successfully! We will confirm it shortly.',
        ],
        'pending' => [
            'title' => '📋 Order Received',
            'emoji' => '✅',
            'message' => 'Your order has been received and is waiting for confirmation.',
        ],
        'approved' => [
            'title' => '✅ Order Approved',
            'emoji' => '👍',
            'message' => 'Great news! Your order has been approved and is being prepared.',
        ],
        'rejected' => [
            'title' => '❌ Order Declined',
            'emoji' => '🛑',
            'message' => 'We are sorry, your order could not be processed.',
        ],
        'received' => [
            'title' => '🏪 Order Confirmed',
            'emoji' => '📦',
            'message' => 'Your order has been confirmed by the restaurant.',
        ],
        'preparing' => [
            'title' => '👨‍🍳 Preparing Your Order',
            'emoji' => '🔥',
            'message' => 'The chef is now preparing your delicious meal!',
        ],
        'ready' => [
            'title' => '🔔 Order Ready',
            'emoji' => '🎉',
            'message' => 'Your order is ready for pickup!',
        ],
        'out_for_delivery' => [
            'title' => '🚗 On The Way',
            'emoji' => '🛵',
            'message' => 'Your order is out for delivery!',
        ],
        'paid' => [
            'title' => '💳 Payment Confirmed',
            'emoji' => '💰',
            'message' => 'Your payment has been received. Thank you!',
        ],
        'completed' => [
            'title' => '⭐ Order Completed',
            'emoji' => '🎊',
            'message' => 'Thank you for your order! We hope you enjoyed it.',
        ],
        'cancelled' => [
            'title' => '❌ Order Cancelled',
            'emoji' => '🛑',
            'message' => 'Your order has been cancelled.',
        ],
    ];

    public function __construct(
        TelegramBotService $botService,
        TelegramKeyboardBuilder $keyboardBuilder
    ) {
        $this->botService = $botService;
        $this->keyboardBuilder = $keyboardBuilder;
    }

    /**
     * Send order status notification to user with automatic retry queueing
     */
    public function sendStatusNotification(
        Order $order,
        string $status,
        ?TelegramUser $telegramUser = null
    ): ?TelegramOrderNotification {
        $user = $telegramUser ?? $this->getTelegramUserForOrder($order);

        if (!$user) {
            return null;
        }

        $statusInfo = self::STATUS_MESSAGES[$status] ?? [
            'title' => '📝 Order Update',
            'emoji' => '📌',
            'message' => "Your order status has been updated to: {$status}",
        ];

        $message = $this->buildStatusMessage($order, $statusInfo);

        $keyboard = null;
        if (in_array($status, ['pending', 'received'])) {
            $keyboard = $this->keyboardBuilder->buildOrderStatusKeyboard($order->id);
        } elseif ($status === 'completed') {
            $keyboard = $this->keyboardBuilder->buildOrderCompletedKeyboard($order->id);
        }

        // sendMessage returns ?array, convert to boolean for database
        $result = $this->botService->sendMessage($user->telegram_id, $message, null, $keyboard);
        $sent = $result !== null;

        $notification = TelegramOrderNotification::create([
            'order_id' => $order->id,
            'telegram_user_id' => $user->id,
            'status' => $status,
            'message' => $message,
            'sent' => $sent,
            'sent_at' => $sent ? now() : null,
        ]);

        // If send failed, queue retry job
        if (!$sent) {
            try {
                TelegramNotificationRetryJob::dispatch($notification);
            } catch (\Throwable $e) {
                \Log::error('Failed to dispatch notification retry job', [
                    'notification_id' => $notification->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $notification;
    }

    /**
     * Send ETA update notification
     */
    public function sendETAUpdate(Order $order, int $etaMinutes): ?TelegramOrderNotification
    {
        $user = $this->getTelegramUserForOrder($order);

        if (!$user) {
            return null;
        }

        $etaText = $this->formatETA($etaMinutes);
        $message = "🕐 *Order Update*\n\nYour order will be ready in approximately *{$etaText}*.";

        $keyboard = $this->keyboardBuilder->buildTrackOrderKeyboard($order->id);
        $result = $this->botService->sendMessage($user->telegram_id, $message, null, $keyboard);
        $sent = $result !== null;

        return TelegramOrderNotification::create([
            'order_id' => $order->id,
            'telegram_user_id' => $user->id,
            'status' => 'eta_update',
            'message' => $message,
            'sent' => $sent,
            'sent_at' => $sent ? now() : null,
        ]);
    }

    /**
     * Send payment confirmation notification
     */
    public function sendPaymentConfirmation(Order $order): ?TelegramOrderNotification
    {
        $user = $this->getTelegramUserForOrder($order);

        if (!$user) {
            return null;
        }

        $message = "💳 *Payment Confirmed*\n\n"
            . "Your payment of *\$" . number_format($order->total_amount, 2) . "* has been received.\n\n"
            . "Order #{$order->id} is now being processed.";

        $keyboard = $this->keyboardBuilder->buildTrackOrderKeyboard($order->id);
        $result = $this->botService->sendMessage($user->telegram_id, $message, null, $keyboard);
        $sent = $result !== null;

        return TelegramOrderNotification::create([
            'order_id' => $order->id,
            'telegram_user_id' => $user->id,
            'status' => 'payment_confirmed',
            'message' => $message,
            'sent' => $sent,
            'sent_at' => $sent ? now() : null,
        ]);
    }

    /**
     * Send reminder for scheduled order
     */
    public function sendScheduledOrderReminder(Order $order, int $minutesUntil): ?TelegramOrderNotification
    {
        $user = $this->getTelegramUserForOrder($order);

        if (!$user) {
            return null;
        }

        $timeText = $this->formatETA($minutesUntil);
        $message = "⏰ *Scheduled Order Reminder*\n\n"
            . "Your order #{$order->id} is scheduled for pickup in *{$timeText}*.\n\n"
            . "We look forward to serving you!";

        $keyboard = $this->keyboardBuilder->buildTrackOrderKeyboard($order->id);
        $result = $this->botService->sendMessage($user->telegram_id, $message, null, $keyboard);
        $sent = $result !== null;

        return TelegramOrderNotification::create([
            'order_id' => $order->id,
            'telegram_user_id' => $user->id,
            'status' => 'scheduled_reminder',
            'message' => $message,
            'sent' => $sent,
            'sent_at' => $sent ? now() : null,
        ]);
    }

    /**
     * Send custom notification
     */
    public function sendCustomNotification(
        Order $order,
        string $title,
        string $messageText,
        ?string $emoji = null
    ): ?TelegramOrderNotification {
        $user = $this->getTelegramUserForOrder($order);

        if (!$user) {
            return null;
        }

        $emoji = $emoji ?? '📢';
        $message = "{$emoji} *{$title}*\n\n{$messageText}";

        $keyboard = $this->keyboardBuilder->buildTrackOrderKeyboard($order->id);
        $result = $this->botService->sendMessage($user->telegram_id, $message, null, $keyboard);
        $sent = $result !== null;

        return TelegramOrderNotification::create([
            'order_id' => $order->id,
            'telegram_user_id' => $user->id,
            'status' => 'custom',
            'message' => $message,
            'sent' => $sent,
            'sent_at' => $sent ? now() : null,
        ]);
    }

    /**
     * Broadcast message to multiple users
     */
    public function broadcastToOrderParticipants(
        array $orderIds,
        string $title,
        string $messageText,
        ?string $emoji = null
    ): int {
        $emoji = $emoji ?? '📢';
        $message = "{$emoji} *{$title}*\n\n{$messageText}";

        $users = TelegramUser::whereHas('orders', function ($query) use ($orderIds) {
            $query->whereIn('id', $orderIds);
        })->get();

        $sentCount = 0;

        foreach ($users as $user) {
            $keyboard = $this->keyboardBuilder->buildMainMenuKeyboard();
            if ($this->botService->sendMessage($user->telegram_id, $message, null, $keyboard)) {
                $sentCount++;
            }
        }

        return $sentCount;
    }

    /**
     * Get TelegramUser for an order (supports both guest and linked accounts)
     */
    public function getTelegramUserForOrder(Order $order): ?TelegramUser
    {
        // Priority 1: Direct telegram_user_id on order (guest orders)
        if ($order->telegram_user_id) {
            return $order->telegramUser;
        }

        // Priority 2: Via customer -> telegram user relationship
        if ($order->customer_id && $order->customer?->telegramUser) {
            return $order->customer->telegramUser;
        }

        return null;
    }

    /**
     * Build the status message with order details
     */
    private function buildStatusMessage(Order $order, array $statusInfo): string
    {
        $emoji = $statusInfo['emoji'];
        $title = $statusInfo['title'];
        $statusMessage = $statusInfo['message'];

        $orderType = $order->order_type_code === 'delivery' ? '🚗 Delivery' : '🏪 Pickup';
        $orderTime = $order->scheduled_time
            ? $order->scheduled_time->format('M d, g:i A')
            : 'ASAP';

        $itemsPreview = $order->items->take(3)->map(function ($item) {
            return "• {$item->menuItem->name} x{$item->quantity}";
        })->join("\n");

        if ($order->items->count() > 3) {
            $itemsPreview .= "\n• ... and " . ($order->items->count() - 3) . " more items";
        }

        $message = "{$emoji} *{$title}*\n\n";
        $message .= "{$statusMessage}\n\n";
        $message .= "📋 *Order #{$order->id}*\n";
        $message .= "{$orderType} | {$orderTime}\n";
        $message .= "💰 Total: *\$" . number_format($order->total_amount, 2) . "*\n\n";
        $message .= "📦 *Items:*\n{$itemsPreview}";

        return $message;
    }

    /**
     * Format ETA in human-readable format
     */
    private function formatETA(int $minutes): string
    {
        if ($minutes < 1) {
            return 'less than a minute';
        } elseif ($minutes < 60) {
            return "{$minutes} minute" . ($minutes > 1 ? 's' : '');
        } elseif ($minutes < 1440) {
            $hours = floor($minutes / 60);
            $mins = $minutes % 60;
            if ($mins > 0) {
                return "{$hours} hour" . ($hours > 1 ? 's' : '') . " and {$mins} minute" . ($mins > 1 ? 's' : '');
            }
            return "{$hours} hour" . ($hours > 1 ? 's' : '');
        } else {
            $days = floor($minutes / 1440);
            return "{$days} day" . ($days > 1 ? 's' : '');
        }
    }

    /**
     * Get notification history for an order
     */
    public function getOrderNotificationHistory(Order $order): \Illuminate\Database\Eloquent\Collection
    {
        return TelegramOrderNotification::where('order_id', $order->id)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Retry failed notifications using queue jobs
     */
    public function retryFailedNotifications(): int
    {
        $failed = TelegramOrderNotification::where('sent', false)
            ->where('failed', false)
            ->where('retry_count', '<', 5)
            ->where('created_at', '>', now()->subHours(24))
            ->get();

        $queued = 0;

        foreach ($failed as $notification) {
            try {
                // Dispatch retry job with error handling
                TelegramNotificationRetryJob::dispatch($notification)
                    ->delay(now()->addSeconds(30 * $notification->retry_count));
                $queued++;
            } catch (\Throwable $e) {
                \Log::error('Failed to dispatch notification retry job', [
                    'notification_id' => $notification->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $queued;
    }

    /**
     * Send notification preference reminder
     */
    public function sendNotificationPreferenceReminder(TelegramUser $user): bool
    {
        $message = "🔔 *Notification Settings*\n\n"
            . "Would you like to receive order status updates via Telegram?\n\n"
            . "You'll be notified when:\n"
            . "• Your order is confirmed\n"
            . "• Your order is being prepared\n"
            . "• Your order is ready\n"
            . "• Your order is completed";

        $keyboard = $this->keyboardBuilder->buildNotificationPreferenceKeyboard();
        $result = $this->botService->sendMessage($user->telegram_id, $message, null, $keyboard);
        return $result !== null;
    }
}

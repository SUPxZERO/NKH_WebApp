<?php

namespace App\Services;

use App\Models\User;
use App\Models\Order;
use App\Models\Promotion;
use App\Models\UserNotification;
use App\Models\NotificationPreference;
use App\Events\CustomerNotificationSent;
use App\Events\AdminNotificationSent;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Notification types
     */
    public const TYPE_ORDER = 'order';
    public const TYPE_PROMOTION = 'promotion';
    public const TYPE_REWARD = 'reward';
    public const TYPE_SYSTEM = 'system';

    /**
     * Send a notification to one or multiple users.
     *
     * @param User|Collection|array $recipients
     * @param string $type
     * @param string $title
     * @param string $message
     * @param string|null $actionUrl
     * @param array $channels ['database', 'broadcast', 'email']
     * @return Collection
     */
    public function send(
        User|Collection|array $recipients,
        string $type,
        string $title,
        string $message,
        ?string $actionUrl = null,
        array $channels = ['database', 'broadcast'],
        bool $respectPreferences = true
    ): Collection {
        // Normalize recipients to collection
        if ($recipients instanceof User) {
            $recipients = collect([$recipients]);
        } elseif (is_array($recipients)) {
            $recipients = collect($recipients);
        }

        $notifications = collect();

        foreach ($recipients as $user) {
            try {
                $notification = null;

                // Check user preferences before sending
                if ($respectPreferences) {
                    $inAppEnabled = NotificationPreference::isEnabled($user->id, $type, 'in_app');
                    if (!$inAppEnabled) {
                        Log::debug("Skipping notification for user {$user->id} - in_app disabled for {$type}");
                        continue;
                    }
                }

                // Database channel (always save to DB if in_app is enabled)
                if (in_array('database', $channels)) {
                    $notification = UserNotification::create([
                        'user_id' => $user->id,
                        'type' => $type,
                        'title' => $title,
                        'message' => $message,
                        'action_url' => $actionUrl,
                        'read' => false,
                    ]);
                    $notifications->push($notification);
                }

                // Broadcast channel (real-time push)
                if (in_array('broadcast', $channels) && $notification) {
                    $pushEnabled = !$respectPreferences || NotificationPreference::isEnabled($user->id, $type, 'push');
                    if ($pushEnabled) {
                        $this->broadcast($notification, $user);
                    }
                }

                // Email channel
                if (in_array('email', $channels)) {
                    $emailEnabled = !$respectPreferences || NotificationPreference::isEnabled($user->id, $type, 'email');
                    if ($emailEnabled) {
                        $this->sendEmail($user, $type, $title, $message, $actionUrl);
                    }
                }

            } catch (\Exception $e) {
                Log::error("Failed to send notification to user {$user->id}: " . $e->getMessage());
            }
        }

        return $notifications;
    }

    /**
     * Send order-related notification.
     */
    public function sendOrderNotification(
        Order $order,
        string $event,
        ?string $customMessage = null
    ): ?UserNotification {
        $user = $order->user ?? $order->customer?->user;
        
        if (!$user) {
            Log::warning("Cannot send order notification - no user found for order {$order->id}");
            return null;
        }

        $data = $this->getOrderNotificationData($order, $event, $customMessage);
        
        $notifications = $this->send(
            $user,
            self::TYPE_ORDER,
            $data['title'],
            $data['message'],
            $data['action_url'],
            ['database', 'broadcast']
        );

        return $notifications->first();
    }

    /**
     * Get notification data based on order event.
     */
    protected function getOrderNotificationData(Order $order, string $event, ?string $customMessage): array
    {
        $orderNumber = $order->order_number ?? "#{$order->id}";
        
        $templates = [
            'placed' => [
                'title' => 'Order Confirmed! 🎉',
                'message' => "Your order {$orderNumber} has been confirmed and is being reviewed.",
                'action_url' => "/customer/orders",
            ],
            'approved' => [
                'title' => 'Order Approved! ✅',
                'message' => "Great news! Your order {$orderNumber} has been approved and is being prepared.",
                'action_url' => "/customer/orders",
            ],
            'rejected' => [
                'title' => 'Order Declined ❌',
                'message' => $customMessage ?? "We're sorry, your order {$orderNumber} could not be processed.",
                'action_url' => "/menu",
            ],
            'preparing' => [
                'title' => 'Preparing Your Order 👨‍🍳',
                'message' => "Your order {$orderNumber} is now being prepared in the kitchen.",
                'action_url' => "/track/{$order->id}",
            ],
            'ready' => [
                'title' => 'Order Ready! 🔔',
                'message' => "Your order {$orderNumber} is ready for pickup!",
                'action_url' => "/track/{$order->id}",
            ],
            'out_for_delivery' => [
                'title' => 'On The Way! 🚗',
                'message' => "Your order {$orderNumber} is out for delivery. It will arrive soon!",
                'action_url' => "/track/{$order->id}",
            ],
            'delivered' => [
                'title' => 'Delivered! 📦',
                'message' => "Your order {$orderNumber} has been delivered. Enjoy your meal!",
                'action_url' => "/customer/orders",
            ],
            'completed' => [
                'title' => 'Order Complete! ⭐',
                'message' => "Thank you for your order {$orderNumber}. We hope you enjoyed it!",
                'action_url' => "/customer/feedback",
            ],
            'cancelled' => [
                'title' => 'Order Cancelled',
                'message' => $customMessage ?? "Your order {$orderNumber} has been cancelled.",
                'action_url' => "/customer/orders",
            ],
        ];

        return $templates[$event] ?? [
            'title' => 'Order Update',
            'message' => $customMessage ?? "Your order {$orderNumber} status has been updated to: {$event}",
            'action_url' => "/customer/orders",
        ];
    }

    /**
     * Send promotion notification.
     */
    public function sendPromotionNotification(
        Promotion $promotion,
        User|Collection|array|null $recipients = null
    ): Collection {
        // If no specific recipients, send to all customers
        if ($recipients === null) {
            $recipients = User::whereHas('customer')->get();
        }

        $title = "🔥 {$promotion->name}";
        $message = $promotion->description ?? "Check out our latest promotion!";
        $actionUrl = "/menu";

        return $this->send(
            $recipients,
            self::TYPE_PROMOTION,
            $title,
            $message,
            $actionUrl,
            ['database', 'broadcast']
        );
    }

    /**
     * Send reward/loyalty notification.
     */
    public function sendRewardNotification(
        User $user,
        int $points,
        string $reason,
        ?string $actionUrl = null
    ): ?UserNotification {
        $title = "You Earned {$points} Points! ⭐";
        $message = $reason;

        $notifications = $this->send(
            $user,
            self::TYPE_REWARD,
            $title,
            $message,
            $actionUrl ?? '/customer/loyalty',
            ['database', 'broadcast']
        );

        return $notifications->first();
    }

    /**
     * Send tier upgrade notification.
     */
    public function sendTierUpgradeNotification(
        User $user,
        string $newTier
    ): ?UserNotification {
        $emojis = [
            'Silver' => '🥈',
            'Gold' => '🥇',
            'Platinum' => '💎',
        ];

        $emoji = $emojis[$newTier] ?? '🎉';
        $title = "Congratulations! {$emoji}";
        $message = "You've been upgraded to {$newTier} tier! Enjoy your new benefits.";

        $notifications = $this->send(
            $user,
            self::TYPE_REWARD,
            $title,
            $message,
            '/customer/loyalty',
            ['database', 'broadcast']
        );

        return $notifications->first();
    }

    /**
     * Send system notification.
     */
    public function sendSystemNotification(
        string $title,
        string $message,
        User|Collection|array|null $recipients = null,
        ?string $actionUrl = null
    ): Collection {
        // If no recipients, send to all users
        if ($recipients === null) {
            $recipients = User::all();
        }

        return $this->send(
            $recipients,
            self::TYPE_SYSTEM,
            $title,
            $message,
            $actionUrl,
            ['database', 'broadcast']
        );
    }

    /**
     * Send notification to admin users.
     */
    public function notifyAdmins(
        string $title,
        string $message,
        ?string $actionUrl = null,
        array $data = []
    ): Collection {
        $admins = User::whereHas('roles', function ($q) {
            $q->whereIn('slug', ['admin', 'manager']);
        })->get();

        $notifications = $this->send(
            $admins,
            self::TYPE_SYSTEM,
            $title,
            $message,
            $actionUrl,
            ['database', 'broadcast']
        );

        // Also broadcast to admin channel
        if ($notifications->isNotEmpty()) {
            event(new AdminNotificationSent($title, $message, $data));
        }

        return $notifications;
    }

    /**
     * Broadcast notification via websocket.
     */
    protected function broadcast(UserNotification $notification, User $user): void
    {
        try {
            event(new CustomerNotificationSent($notification, $user));
        } catch (\Exception $e) {
            Log::warning("Failed to broadcast notification: " . $e->getMessage());
        }
    }

    /**
     * Send email notification.
     */
    protected function sendEmail(
        User $user,
        string $type,
        string $title,
        string $message,
        ?string $actionUrl
    ): void {
        // TODO: Implement email sending
        // This could use Laravel's Mail facade or a dedicated notification class
        Log::info("Email notification would be sent to {$user->email}: {$title}");
    }

    /**
     * Get unread count for a user.
     */
    public function getUnreadCount(User $user): int
    {
        return UserNotification::where('user_id', $user->id)
            ->where('read', false)
            ->count();
    }

    /**
     * Mark all notifications as read for a user.
     */
    public function markAllAsRead(User $user): int
    {
        return UserNotification::where('user_id', $user->id)
            ->where('read', false)
            ->update([
                'read' => true,
                'read_at' => now(),
            ]);
    }

    // ========================================
    // TARGETED NOTIFICATION METHODS
    // ========================================

    /**
     * Target types for notifications
     */
    public const TARGET_ALL_USERS = 'all_users';
    public const TARGET_ALL_CUSTOMERS = 'all_customers';
    public const TARGET_ALL_EMPLOYEES = 'all_employees';
    public const TARGET_BY_ROLE = 'by_role';
    public const TARGET_BY_TIER = 'by_tier';
    public const TARGET_BY_LOCATION = 'by_location';
    public const TARGET_SPECIFIC_USERS = 'specific_users';
    public const TARGET_RECENT_CUSTOMERS = 'recent_customers';

    /**
     * Get available target options for admin UI
     */
    public static function getTargetOptions(): array
    {
        return [
            self::TARGET_ALL_USERS => 'All Users',
            self::TARGET_ALL_CUSTOMERS => 'All Customers',
            self::TARGET_ALL_EMPLOYEES => 'All Employees',
            self::TARGET_BY_ROLE => 'By Role/Position',
            self::TARGET_BY_TIER => 'By Customer Tier',
            self::TARGET_BY_LOCATION => 'By Location',
            self::TARGET_SPECIFIC_USERS => 'Specific Users',
            self::TARGET_RECENT_CUSTOMERS => 'Recent Customers (Last 30 Days)',
        ];
    }

    /**
     * Get available roles for targeting
     */
    public static function getAvailableRoles(): array
    {
        return [
            'admin' => 'Admin',
            'manager' => 'Manager',
            'waiter' => 'Waiter',
            'chef' => 'Chef',
            'cashier' => 'Cashier',
            'delivery' => 'Delivery',
            'customer' => 'Customer',
        ];
    }

    /**
     * Get available customer tiers for targeting
     */
    public static function getAvailableTiers(): array
    {
        return [
            'bronze' => 'Bronze',
            'silver' => 'Silver',
            'gold' => 'Gold',
            'platinum' => 'Platinum',
        ];
    }

    /**
     * Get recipients based on target type and parameters
     */
    public function getRecipientsByTarget(string $targetType, array $params = []): Collection
    {
        return match ($targetType) {
            self::TARGET_ALL_USERS => User::all(),
            self::TARGET_ALL_CUSTOMERS => $this->getCustomers(),
            self::TARGET_ALL_EMPLOYEES => $this->getEmployees(),
            self::TARGET_BY_ROLE => $this->getUsersByRoles($params['roles'] ?? []),
            self::TARGET_BY_TIER => $this->getCustomersByTier($params['tiers'] ?? []),
            self::TARGET_BY_LOCATION => $this->getUsersByLocation($params['location_ids'] ?? []),
            self::TARGET_SPECIFIC_USERS => $this->getSpecificUsers($params['user_ids'] ?? []),
            self::TARGET_RECENT_CUSTOMERS => $this->getRecentCustomers($params['days'] ?? 30),
            default => collect(),
        };
    }

    /**
     * Send targeted notification with flexible targeting
     */
    public function sendTargeted(
        string $targetType,
        array $targetParams,
        string $type,
        string $title,
        string $message,
        ?string $actionUrl = null
    ): Collection {
        $recipients = $this->getRecipientsByTarget($targetType, $targetParams);
        
        Log::info("Sending targeted notification", [
            'target_type' => $targetType,
            'recipient_count' => $recipients->count(),
            'type' => $type,
            'title' => $title,
        ]);

        return $this->send($recipients, $type, $title, $message, $actionUrl);
    }

    /**
     * Get all customers (users with customer profile)
     */
    public function getCustomers(): Collection
    {
        return User::whereHas('customer')->get();
    }

    /**
     * Get all employees (users with employee profile)
     */
    public function getEmployees(): Collection
    {
        return User::whereHas('employee')->get();
    }

    /**
     * Get users by role slugs
     */
    public function getUsersByRoles(array $roles): Collection
    {
        if (empty($roles)) {
            return collect();
        }

        return User::whereHas('roles', function ($q) use ($roles) {
            $q->whereIn('slug', $roles);
        })->get();
    }

    /**
     * Send notification to users by role
     */
    public function notifyByRole(
        array $roles,
        string $title,
        string $message,
        ?string $actionUrl = null,
        string $type = self::TYPE_SYSTEM
    ): Collection {
        $recipients = $this->getUsersByRoles($roles);
        return $this->send($recipients, $type, $title, $message, $actionUrl);
    }

    /**
     * Get customers by tier
     */
    public function getCustomersByTier(array $tiers): Collection
    {
        if (empty($tiers)) {
            return collect();
        }

        return User::whereHas('customer', function ($q) use ($tiers) {
            $q->whereIn('tier', $tiers);
        })->get();
    }

    /**
     * Send notification to customers by tier
     */
    public function notifyByTier(
        array $tiers,
        string $title,
        string $message,
        ?string $actionUrl = null,
        string $type = self::TYPE_PROMOTION
    ): Collection {
        $recipients = $this->getCustomersByTier($tiers);
        return $this->send($recipients, $type, $title, $message, $actionUrl);
    }

    /**
     * Get users by location
     */
    public function getUsersByLocation(array $locationIds): Collection
    {
        if (empty($locationIds)) {
            return collect();
        }

        return User::where(function ($q) use ($locationIds) {
            // Employees at these locations
            $q->whereHas('employee', function ($eq) use ($locationIds) {
                $eq->whereIn('location_id', $locationIds);
            })
            // Or customers with preferred location
            ->orWhereHas('customer', function ($cq) use ($locationIds) {
                $cq->whereIn('preferred_location_id', $locationIds);
            });
        })->get();
    }

    /**
     * Send notification to users at specific locations
     */
    public function notifyByLocation(
        array $locationIds,
        string $title,
        string $message,
        ?string $actionUrl = null,
        string $type = self::TYPE_SYSTEM
    ): Collection {
        $recipients = $this->getUsersByLocation($locationIds);
        return $this->send($recipients, $type, $title, $message, $actionUrl);
    }

    /**
     * Get specific users by IDs
     */
    public function getSpecificUsers(array $userIds): Collection
    {
        if (empty($userIds)) {
            return collect();
        }

        return User::whereIn('id', $userIds)->get();
    }

    /**
     * Send notification to specific users
     */
    public function notifyUsers(
        array $userIds,
        string $title,
        string $message,
        ?string $actionUrl = null,
        string $type = self::TYPE_SYSTEM
    ): Collection {
        $recipients = $this->getSpecificUsers($userIds);
        return $this->send($recipients, $type, $title, $message, $actionUrl);
    }

    /**
     * Get customers who ordered in the last X days
     */
    public function getRecentCustomers(int $days = 30): Collection
    {
        $cutoffDate = now()->subDays($days);
        
        return User::whereHas('customer.orders', function ($q) use ($cutoffDate) {
            $q->where('created_at', '>=', $cutoffDate);
        })->get();
    }

    /**
     * Send notification to recent customers
     */
    public function notifyRecentCustomers(
        int $days,
        string $title,
        string $message,
        ?string $actionUrl = null,
        string $type = self::TYPE_PROMOTION
    ): Collection {
        $recipients = $this->getRecentCustomers($days);
        return $this->send($recipients, $type, $title, $message, $actionUrl);
    }

    /**
     * Notify all waiters/servers
     */
    public function notifyWaiters(
        string $title,
        string $message,
        ?string $actionUrl = null
    ): Collection {
        return $this->notifyByRole(['waiter'], $title, $message, $actionUrl);
    }

    /**
     * Notify all kitchen staff (chefs)
     */
    public function notifyKitchen(
        string $title,
        string $message,
        ?string $actionUrl = null
    ): Collection {
        return $this->notifyByRole(['chef'], $title, $message, $actionUrl);
    }

    /**
     * Notify delivery staff
     */
    public function notifyDelivery(
        string $title,
        string $message,
        ?string $actionUrl = null
    ): Collection {
        return $this->notifyByRole(['delivery'], $title, $message, $actionUrl);
    }

    /**
     * Notify VIP customers (Gold & Platinum)
     */
    public function notifyVIPCustomers(
        string $title,
        string $message,
        ?string $actionUrl = null
    ): Collection {
        return $this->notifyByTier(['gold', 'platinum'], $title, $message, $actionUrl);
    }

    /**
     * Get recipient count preview (for admin UI)
     */
    public function getRecipientCountPreview(string $targetType, array $params = []): int
    {
        return $this->getRecipientsByTarget($targetType, $params)->count();
    }
}

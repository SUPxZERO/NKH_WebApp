<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserNotification extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'user_id',
        'broadcast_notification_id',
        'type',
        'title',
        'message',
        'action_url',
        'target_type',
        'target_metadata',
        'read',
        'read_at',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'read' => 'boolean',
        'read_at' => 'datetime',
        'target_metadata' => 'array',
    ];

    /**
     * Get the user that owns the notification.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the broadcast notification if this is part of a broadcast
     */
    public function broadcastNotification(): BelongsTo
    {
        return $this->belongsTo(BroadcastNotification::class);
    }

    /**
     * Scope for unread notifications.
     */
    public function scopeUnread($query)
    {
        return $query->where('read', false);
    }

    /**
     * Mark the notification as read.
     */
    public function markAsRead(): void
    {
        $this->update([
            'read' => true,
            'read_at' => now(),
        ]);
    }

    /**
     * Create an order notification.
     */
    public static function createOrderNotification(int $userId, string $title, string $message, ?string $actionUrl = null): self
    {
        return self::create([
            'user_id' => $userId,
            'type' => 'order',
            'title' => $title,
            'message' => $message, 
            'action_url' => $actionUrl,
        ]);
    }

    /**
     * Create a promotion notification.
     */
    public static function createPromotionNotification(int $userId, string $title, string $message, ?string $actionUrl = null): self
    {
        return self::create([
            'user_id' => $userId,
            'type' => 'promotion',
            'title' => $title,
            'message' => $message,
            'action_url' => $actionUrl,
        ]);
    }

    /**
     * Create a reward notification.
     */
    public static function createRewardNotification(int $userId, string $title, string $message, ?string $actionUrl = null): self
    {
        return self::create([
            'user_id' => $userId,
            'type' => 'reward',
            'title' => $title,
            'message' => $message,
            'action_url' => $actionUrl,
        ]);
    }

    /**
     * Create a system notification.
     */
    public static function createSystemNotification(int $userId, string $title, string $message, ?string $actionUrl = null): self
    {
        return self::create([
            'user_id' => $userId,
            'type' => 'system',
            'title' => $title,
            'message' => $message,
            'action_url' => $actionUrl,
        ]);
    }
}

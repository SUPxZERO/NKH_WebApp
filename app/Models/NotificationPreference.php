<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationPreference extends Model
{
    use HasFactory;

    protected $guarded = [
        'id',
        'user_id',
        'channel',
        'type',
        'enabled',
            'created_at',
        'updated_at',
    ];

    protected $casts = [
        'enabled' => 'boolean',
    ];

    /**
     * Available notification channels
     */
    public const CHANNELS = [
        'in_app' => 'In-App Notifications',
        'push' => 'Push Notifications',
        'email' => 'Email Notifications',
    ];

    /**
     * Available notification types
     */
    public const TYPES = [
        'order' => 'Order Updates',
        'promotion' => 'Promotions & Offers',
        'reward' => 'Loyalty & Rewards',
        'system' => 'System Announcements',
        'reservation' => 'Reservation Updates',
    ];

    /**
     * Relationship to user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get user's preference for a specific type and channel
     */
    public static function isEnabled(int $userId, string $type, string $channel = 'in_app'): bool
    {
        $pref = self::where('user_id', $userId)
            ->where('type', $type)
            ->where('channel', $channel)
            ->first();

        // Default to enabled if no preference exists
        return $pref ? $pref->enabled : true;
    }

    /**
     * Get all preferences for a user
     */
    public static function getForUser(int $userId): array
    {
        $preferences = self::where('user_id', $userId)->get();
        
        $result = [];
        foreach (self::CHANNELS as $channel => $channelLabel) {
            foreach (self::TYPES as $type => $typeLabel) {
                $pref = $preferences->first(fn($p) => $p->channel === $channel && $p->type === $type);
                $result[$channel][$type] = $pref ? $pref->enabled : true;
            }
        }
        
        return $result;
    }

    /**
     * Update preference for a user
     */
    public static function setPreference(int $userId, string $type, string $channel, bool $enabled): self
    {
        return self::updateOrCreate(
            [
                'user_id' => $userId,
                'type' => $type,
                'channel' => $channel,
            ],
            [
                'enabled' => $enabled,
            ]
        );
    }

    /**
     * Bulk update preferences for a user
     */
    public static function updateBulk(int $userId, array $preferences): void
    {
        foreach ($preferences as $channel => $types) {
            foreach ($types as $type => $enabled) {
                self::setPreference($userId, $type, $channel, (bool) $enabled);
            }
        }
    }
}

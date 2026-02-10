<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotificationPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'channel',
        'enabled',
    ];

    protected $casts = [
        'enabled' => 'boolean',
    ];

    /**
     * Available notification channels
     */
    const CHANNELS = [
        'email' => 'Email',
        'sms' => 'SMS',
        'push' => 'Push Notification',
        'in_app' => 'In-App Notification',
    ];

    /**
     * Available notification types
     */
    const TYPES = [
        'order' => 'Order Updates',
        'promotion' => 'Promotions',
        'system' => 'System Announcements',
        'reservation' => 'Reservation Updates',
    ];

    /**
     * Default preferences for a new user
     */
    public static function defaultPreferences(): array
    {
        return [
            'in_app' => [
                'order' => true,
                'reservation' => true,
                'system' => true,
            ],
            'email' => [
                'order' => true,
                'promotion' => true,
                'system' => true,
            ],
            'push' => [
                'order' => true,
                'reservation' => true,
            ],
            'sms' => [
                'order' => false,
                'reservation' => true,
            ]
        ];
    }

    /**
     * Get preferences for a user, merged with defaults
     */
    public static function getForUser(int $userId): array
    {
        $preferences = self::where('user_id', $userId)->get();
        $defaults = self::defaultPreferences();

        $result = [];

        // Organize defaults structure
        foreach (array_keys(self::CHANNELS) as $channel) {
            foreach (array_keys(self::TYPES) as $type) {
                // Check if this combination exists in defaults
                // Otherwise default to false
                $defaultEnabled = $defaults[$channel][$type] ?? false;
                $result[$channel][$type] = $defaultEnabled;
            }
        }

        // Overlay stored user preferences
        foreach ($preferences as $pref) {
            if (isset($result[$pref->channel]) && isset($result[$pref->channel][$pref->type])) {
                $result[$pref->channel][$pref->type] = $pref->enabled;
            }
        }

        return $result;
    }

    /**
     * Update bulk preferences
     */
    public static function updateBulk(int $userId, array $preferences): void
    {
        foreach ($preferences as $channel => $types) {
            if (!array_key_exists($channel, self::CHANNELS)) {
                continue;
            }

            foreach ($types as $type => $enabled) {
                if (!array_key_exists($type, self::TYPES)) {
                    continue;
                }

                self::updateOrCreate(
                    [
                        'user_id' => $userId,
                        'channel' => $channel,
                        'type' => $type,
                    ],
                    [
                        'enabled' => $enabled
                    ]
                );
            }
        }
    }

    /**
     * Set a single preference
     */
    public static function setPreference(int $userId, string $type, string $channel, bool $enabled): self
    {
        return self::updateOrCreate(
            [
                'user_id' => $userId,
                'channel' => $channel,
                'type' => $type,
            ],
            [
                'enabled' => $enabled
            ]
        );
    }
}

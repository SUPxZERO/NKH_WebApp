<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSetting extends Model
{
    use HasFactory;

    protected $guarded = [
        'id',
        'user_id',
        // Notifications
        'notification_order_updates',
        'notification_promotions',
        'notification_newsletter',
        'notification_sms',
        'notification_push',
        // Privacy
        'privacy_show_profile',
        'privacy_share_order_history',
        'privacy_allow_analytics',
        // Appearance & Language
        'theme',
        'language',
            'created_at',
        'updated_at',
    ];

    protected $casts = [
        'notification_order_updates' => 'boolean',
        'notification_promotions' => 'boolean',
        'notification_newsletter' => 'boolean',
        'notification_sms' => 'boolean',
        'notification_push' => 'boolean',
        'privacy_show_profile' => 'boolean',
        'privacy_share_order_history' => 'boolean',
        'privacy_allow_analytics' => 'boolean',
    ];

    /**
     * Get the user that owns the settings.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get default settings array.
     */
    public static function getDefaults(): array
    {
        return [
            'notification_order_updates' => true,
            'notification_promotions' => true,
            'notification_newsletter' => false,
            'notification_sms' => false,
            'notification_push' => true,
            'privacy_show_profile' => true,
            'privacy_share_order_history' => false,
            'privacy_allow_analytics' => true,
            'theme' => 'system',
            'language' => 'en',
        ];
    }

    /**
     * Transform settings to frontend format.
     */
    public function toFrontendFormat(): array
    {
        return [
            'notifications' => [
                'orderUpdates' => $this->notification_order_updates,
                'promotions' => $this->notification_promotions,
                'newsletter' => $this->notification_newsletter,
                'smsNotifications' => $this->notification_sms,
                'pushNotifications' => $this->notification_push,
            ],
            'privacy' => [
                'showProfile' => $this->privacy_show_profile,
                'shareOrderHistory' => $this->privacy_share_order_history,
                'allowAnalytics' => $this->privacy_allow_analytics,
            ],
            'theme' => $this->theme,
            'language' => $this->language,
        ];
    }

    /**
     * Update settings from frontend format.
     */
    public function updateFromFrontend(array $data): void
    {
        // Notifications
        if (isset($data['notifications'])) {
            $notifications = $data['notifications'];
            $this->notification_order_updates = $notifications['orderUpdates'] ?? $this->notification_order_updates;
            $this->notification_promotions = $notifications['promotions'] ?? $this->notification_promotions;
            $this->notification_newsletter = $notifications['newsletter'] ?? $this->notification_newsletter;
            $this->notification_sms = $notifications['smsNotifications'] ?? $this->notification_sms;
            $this->notification_push = $notifications['pushNotifications'] ?? $this->notification_push;
        }

        // Privacy
        if (isset($data['privacy'])) {
            $privacy = $data['privacy'];
            $this->privacy_show_profile = $privacy['showProfile'] ?? $this->privacy_show_profile;
            $this->privacy_share_order_history = $privacy['shareOrderHistory'] ?? $this->privacy_share_order_history;
            $this->privacy_allow_analytics = $privacy['allowAnalytics'] ?? $this->privacy_allow_analytics;
        }

        // Theme & Language
        if (isset($data['theme'])) {
            $this->theme = $data['theme'];
        }
        if (isset($data['language'])) {
            $this->language = $data['language'];
        }

        $this->save();
    }
}

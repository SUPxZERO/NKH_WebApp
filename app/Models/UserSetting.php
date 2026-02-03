<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserSetting extends Model
{
    protected $fillable = [
        'user_id',
        'notifications',
        'privacy',
        'theme',
        'language',
    ];

    protected $casts = [
        'notifications' => 'array',
        'privacy' => 'array',
    ];

    public static function getDefaults(): array
    {
        return [
            'notifications' => [
                'orderUpdates' => true,
                'promotions' => false,
                'newsletter' => true,
                'smsNotifications' => true,
                'pushNotifications' => true,
            ],
            'privacy' => [
                'showProfile' => true,
                'shareOrderHistory' => false,
                'allowAnalytics' => true,
            ],
            'theme' => 'system',
            'language' => 'en',
        ];
    }

    public function toFrontendFormat(): array
    {
        return [
            'notifications' => $this->notifications ?? self::getDefaults()['notifications'],
            'privacy' => $this->privacy ?? self::getDefaults()['privacy'],
            'theme' => $this->theme ?? 'system',
            'language' => $this->language ?? 'en',
        ];
    }

    public function updateFromFrontend(array $validated): void
    {
        // Merge logic would be better here, but for now simple assignment or array merge if partial
        if (isset($validated['notifications'])) {
            $this->notifications = array_merge($this->notifications ?? self::getDefaults()['notifications'], $validated['notifications']);
        }
        if (isset($validated['privacy'])) {
            $this->privacy = array_merge($this->privacy ?? self::getDefaults()['privacy'], $validated['privacy']);
        }
        if (isset($validated['theme'])) {
            $this->theme = $validated['theme'];
        }
        if (isset($validated['language'])) {
            $this->language = $validated['language'];
        }
        $this->save();
    }
}

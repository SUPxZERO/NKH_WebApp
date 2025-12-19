<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BroadcastNotification extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'message',
        'type',
        'target_type',
        'target_metadata',
        'action_url',
        'recipient_count',
        'created_by',
    ];

    protected $casts = [
        'target_metadata' => 'array',
        'recipient_count' => 'integer',
    ];

    /**
     * Get all user notifications for this broadcast
     */
    public function userNotifications(): HasMany
    {
        return $this->hasMany(UserNotification::class);
    }

    /**
     * Get the user who created this broadcast
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the count of read notifications
     */
    public function getReadCountAttribute(): int
    {
        return $this->userNotifications()->where('read', true)->count();
    }

    /**
     * Get the count of unread notifications
     */
    public function getUnreadCountAttribute(): int
    {
        return $this->userNotifications()->where('read', false)->count();
    }
}

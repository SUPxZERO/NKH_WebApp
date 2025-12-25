<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TelegramOrderNotification extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'telegram_user_id',
        'status',
        'message',
        'sent',
        'sent_at',
    ];

    protected $casts = [
        'sent' => 'boolean',
        'sent_at' => 'datetime',
    ];

    /**
     * Get the order this notification is for
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the Telegram user who receives this notification
     */
    public function telegramUser(): BelongsTo
    {
        return $this->belongsTo(TelegramUser::class);
    }

    /**
     * Mark as sent
     */
    public function markAsSent(): self
    {
        $this->update([
            'sent' => true,
            'sent_at' => now(),
        ]);

        return $this;
    }

    /**
     * Scope sent notifications
     */
    public function scopeSent($query)
    {
        return $query->where('sent', true);
    }

    /**
     * Scope pending notifications
     */
    public function scopePending($query)
    {
        return $query->where('sent', false);
    }

    /**
     * Scope by status
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }
}

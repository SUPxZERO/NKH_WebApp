<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class TableSession extends Model
{
    use HasFactory;

    const STATUS_ACTIVE = 'active';
    const STATUS_ORDERING = 'ordering';
    const STATUS_PAYMENT_PENDING = 'payment_pending';
    const STATUS_COMPLETED = 'completed';

    protected $guarded = [
        'id',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'last_activity_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function table(): BelongsTo
    {
        return $this->belongsTo(DiningTable::class, 'table_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function telegramUser(): BelongsTo
    {
        return $this->belongsTo(TelegramUser::class, 'telegram_user_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public static function findByToken(string $token): ?self
    {
        return self::query()
            ->where('session_token', $token)
            ->whereIn('status', [self::STATUS_ACTIVE, self::STATUS_ORDERING, self::STATUS_PAYMENT_PENDING])
            ->with('table.floor')
            ->first();
    }

    public static function findOrCreateForTable(
        DiningTable $table,
        ?Customer $customer,
        ?TelegramUser $telegramUser,
        string $deviceFingerprint,
        ?string $userAgent,
        ?string $ipAddress
    ): self {
        $query = self::query()
            ->where('table_id', $table->id)
            ->whereIn('status', [self::STATUS_ACTIVE, self::STATUS_ORDERING, self::STATUS_PAYMENT_PENDING]);

        if ($customer) {
            $query->where('customer_id', $customer->id);
        } elseif ($telegramUser) {
            $query->where('telegram_user_id', $telegramUser->id);
        } else {
            $query->where('device_fingerprint', $deviceFingerprint);
        }

        $session = $query->orderByDesc('last_activity_at')->first();

        if ($session) {
            $session->forceFill([
                'last_activity_at' => now(),
                'user_agent' => $userAgent,
                'ip_address' => $ipAddress,
            ])->save();

            return $session->loadMissing('table.floor');
        }

        return self::create([
            'table_id' => $table->id,
            'customer_id' => $customer?->id,
            'telegram_user_id' => $telegramUser?->id,
            'order_id' => null,
            'session_token' => Str::random(32),
            'status' => self::STATUS_ACTIVE,
            'device_fingerprint' => $deviceFingerprint,
            'user_agent' => $userAgent,
            'ip_address' => $ipAddress,
            'started_at' => now(),
            'last_activity_at' => now(),
        ]);
    }

    public function updateStatus(string $status): void
    {
        $this->forceFill([
            'status' => $status,
            'last_activity_at' => now(),
        ])->save();
    }

    public function linkOrder(Order $order): void
    {
        $this->forceFill([
            'order_id' => $order->id,
            'status' => self::STATUS_ORDERING,
            'last_activity_at' => now(),
        ])->save();
    }

    public function hasOrder(): bool
    {
        return !empty($this->order_id);
    }

    public function close(): void
    {
        $this->forceFill([
            'status' => self::STATUS_COMPLETED,
            'closed_at' => now(),
        ])->save();
    }
}

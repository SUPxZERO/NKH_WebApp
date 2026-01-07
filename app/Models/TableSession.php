<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * TableSession Model
 * 
 * Tracks customer sessions at QR-scanned tables.
 * Each session represents a customer or group at a specific table.
 */
class TableSession extends Model
{
    use HasFactory;

    // Session statuses
    const STATUS_ACTIVE = 'active';
    const STATUS_ORDERING = 'ordering';
    const STATUS_PAYMENT_PENDING = 'payment_pending';
    const STATUS_COMPLETED = 'completed';
    const STATUS_EXPIRED = 'expired';

    // Session expiry time in hours
    const EXPIRY_HOURS = 4;

    protected $fillable = [
        'table_id',
        'session_token',
        'customer_id',
        'telegram_user_id',
        'device_fingerprint',
        'user_agent',
        'ip_address',
        'status',
        'order_id',
        'started_at',
        'last_activity_at',
        'closed_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'last_activity_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    // ==================== RELATIONSHIPS ====================

    /**
     * The table this session belongs to
     */
    public function table(): BelongsTo
    {
        return $this->belongsTo(DiningTable::class, 'table_id');
    }

    /**
     * The authenticated customer (if logged in)
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * The Telegram user (for guest sessions)
     */
    public function telegramUser(): BelongsTo
    {
        return $this->belongsTo(TelegramUser::class);
    }

    /**
     * The order created during this session
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    // ==================== SCOPES ====================

    /**
     * Scope to get active sessions
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', [
            self::STATUS_ACTIVE,
            self::STATUS_ORDERING,
            self::STATUS_PAYMENT_PENDING,
        ]);
    }

    /**
     * Scope to get non-expired sessions
     */
    public function scopeNotExpired($query)
    {
        return $query->where('last_activity_at', '>=', now()->subHours(self::EXPIRY_HOURS));
    }

    /**
     * Scope by table
     */
    public function scopeForTable($query, int $tableId)
    {
        return $query->where('table_id', $tableId);
    }

    // ==================== HELPER METHODS ====================

    /**
     * Check if session is active
     */
    public function isActive(): bool
    {
        return in_array($this->status, [
            self::STATUS_ACTIVE,
            self::STATUS_ORDERING,
            self::STATUS_PAYMENT_PENDING,
        ]);
    }

    /**
     * Check if session is expired
     */
    public function isExpired(): bool
    {
        if ($this->status === self::STATUS_EXPIRED) {
            return true;
        }

        return $this->last_activity_at->diffInHours(now()) >= self::EXPIRY_HOURS;
    }

    /**
     * Check if session is active and valid (not expired)
     */
    public function isValid(): bool
    {
        return $this->isActive() && !$this->isExpired();
    }

    /**
     * Check if session has an associated order
     */
    public function hasOrder(): bool
    {
        return $this->order_id !== null;
    }

    /**
     * Check if session is a guest session (no authenticated customer)
     */
    public function isGuest(): bool
    {
        return $this->customer_id === null;
    }

    /**
     * Get the display name for the session owner
     */
    public function getOwnerNameAttribute(): string
    {
        if ($this->customer_id && $this->customer?->user) {
            return $this->customer->user->name;
        }
        if ($this->telegram_user_id && $this->telegramUser) {
            return $this->telegramUser->display_name;
        }
        return 'Guest';
    }

    /**
     * Update last activity timestamp
     */
    /**
     * Update last activity timestamp
     */
    public function touch($attribute = null)
    {
        $this->last_activity_at = now();
        return parent::touch($attribute);
    }

    /**
     * Update session status
     */
    public function updateStatus(string $status): bool
    {
        $this->status = $status;
        $this->last_activity_at = now();
        return $this->save();
    }

    /**
     * Link an order to this session
     */
    public function linkOrder(Order $order): bool
    {
        $this->order_id = $order->id;
        $this->status = self::STATUS_PAYMENT_PENDING;
        $this->last_activity_at = now();
        return $this->save();
    }

    /**
     * Close the session
     */
    public function close(): bool
    {
        $this->status = self::STATUS_COMPLETED;
        $this->closed_at = now();
        return $this->save();
    }

    /**
     * Mark session as expired
     */
    public function expire(): bool
    {
        $this->status = self::STATUS_EXPIRED;
        $this->closed_at = now();
        return $this->save();
    }

    /**
     * Generate a new session token
     */
    public static function generateSessionToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    /**
     * Create a new session for a table
     */
    public static function createForTable(
        DiningTable $table,
        ?Customer $customer = null,
        ?TelegramUser $telegramUser = null,
        ?string $deviceFingerprint = null,
        ?string $userAgent = null,
        ?string $ipAddress = null
    ): self {
        return self::create([
            'table_id' => $table->id,
            'session_token' => self::generateSessionToken(),
            'customer_id' => $customer?->id,
            'telegram_user_id' => $telegramUser?->id,
            'device_fingerprint' => $deviceFingerprint,
            'user_agent' => $userAgent,
            'ip_address' => $ipAddress,
            'status' => self::STATUS_ACTIVE,
            'started_at' => now(),
            'last_activity_at' => now(),
        ]);
    }

    /**
     * Find active session by token
     */
    public static function findByToken(string $token): ?self
    {
        return self::where('session_token', $token)
            ->active()
            ->notExpired()
            ->first();
    }

    /**
     * Find or create session for table and customer
     */
    public static function findOrCreateForTable(
        DiningTable $table,
        ?Customer $customer = null,
        ?TelegramUser $telegramUser = null,
        ?string $deviceFingerprint = null,
        ?string $userAgent = null,
        ?string $ipAddress = null
    ): self {
        // Try to find existing active session for this table and customer
        $query = self::forTable($table->id)
            ->active()
            ->notExpired();

        if ($customer) {
            $query->where('customer_id', $customer->id);
        } elseif ($telegramUser) {
            $query->where('telegram_user_id', $telegramUser->id);
        } elseif ($deviceFingerprint) {
            $query->where('device_fingerprint', $deviceFingerprint);
        }

        $session = $query->first();

        if ($session) {
            $session->touch();
            return $session;
        }

        // Create new session
        return self::createForTable(
            $table,
            $customer,
            $telegramUser,
            $deviceFingerprint,
            $userAgent,
            $ipAddress
        );
    }
}

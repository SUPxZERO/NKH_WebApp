<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class DiningTable extends Model
{
    use HasFactory, \App\Traits\BranchScopable;

    protected $table = 'tables';

    // Table statuses
    const STATUS_AVAILABLE = 'available';
    const STATUS_RESERVED = 'reserved';
    const STATUS_OCCUPIED = 'occupied';
    const STATUS_UNAVAILABLE = 'unavailable';

    /**
     * SECURITY: Protect QR code security and table status workflow
     * 
     * Protected fields:
     * - Security: qr_token, qr_generated_at (security-sensitive)
     * - Workflow: status (occupancy management)
     */
    protected $guarded = [
        'id',
        'qr_token',             // ⚠️ CRITICAL: Security token (HMAC signed)
        'qr_generated_at',      // ⚠️ Timestamp for QR validity
        'qr_url',               // ⚠️ Generated URL
        // status is workflow managed but needs to be seeded
        'created_at',
        'updated_at',
    ];


    protected $casts = [
        'qr_generated_at' => 'datetime',
    ];

    // ==================== RELATIONSHIPS ====================

    public function floor(): BelongsTo
    {
        return $this->belongsTo(Floor::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'table_id');
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class, 'table_id');
    }

    /* DEAD CODE: table_sessions does not exist
    public function sessions(): HasMany
    {
        return $this->hasMany(TableSession::class, 'table_id');
    }
    */

    // ==================== SCOPES ====================

    /**
     * Scope to get available tables
     */
    public function scopeAvailable($query)
    {
        return $query->where('status', self::STATUS_AVAILABLE);
    }

    /**
     * Scope to get tables with QR codes
     */
    public function scopeWithQr($query)
    {
        return $query->whereNotNull('qr_token');
    }

    /**
     * Scope to get tables without QR codes
     */
    public function scopeWithoutQr($query)
    {
        return $query->whereNull('qr_token');
    }

    // ==================== QR CODE METHODS ====================

    /**
     * Generate a new QR token for this table
     * Format: UUID v4 + HMAC-SHA256 signature (first 8 chars)
     */
    public function generateQrToken(): string
    {
        $uuid = Str::uuid()->toString();
        $signature = substr(hash_hmac('sha256', $uuid, config('app.key')), 0, 8);
        $token = "{$uuid}.{$signature}";

        $this->qr_token = $token;
        $this->qr_generated_at = now();
        $this->qr_url = $this->buildQrUrl($token);
        $this->save();

        return $token;
    }

    /**
     * Build the full URL for the QR code
     */
    protected function buildQrUrl(string $token): string
    {
        return rtrim(config('app.url'), '/') . '/t/' . $token;
    }

    /**
     * Check if table has a valid QR token
     */
    public function hasQrToken(): bool
    {
        return !empty($this->qr_token);
    }

    /**
     * Get the QR URL or generate if not exists
     */
    public function getQrUrl(): string
    {
        if (!$this->hasQrToken()) {
            $this->generateQrToken();
        }
        return $this->qr_url ?? $this->buildQrUrl($this->qr_token);
    }

    /**
     * Verify a QR token signature
     */
    public static function verifyQrToken(string $token): bool
    {
        if (!str_contains($token, '.')) {
            return false;
        }

        [$uuid, $signature] = explode('.', $token, 2);

        // Validate UUID format
        if (!Str::isUuid($uuid)) {
            return false;
        }

        $expected = substr(hash_hmac('sha256', $uuid, config('app.key')), 0, 8);
        return hash_equals($expected, $signature);
    }

    /**
     * Find table by QR token
     */
    public static function findByQrToken(string $token): ?self
    {
        if (!self::verifyQrToken($token)) {
            return null;
        }
        return self::where('qr_token', $token)->first();
    }

    // ==================== SESSION METHODS ====================

    /* DEAD CODE
    public function activeSessions(): HasMany
    {
        return $this->sessions()
            ->active()
            ->notExpired();
    }
    */

    /* DEAD CODE
    public function activeSession(): ?TableSession
    {
        return $this->activeSessions()
            ->orderBy('last_activity_at', 'desc')
            ->first();
    }
    */

    /**
     * Check if table has any active session
     * DEAD CODE: Always false as table_sessions does not exist
     */
    public function hasActiveSession(): bool
    {
        return \App\Models\TableSession::query()
            ->where('table_id', $this->id)
            ->whereIn('status', [
                \App\Models\TableSession::STATUS_ACTIVE,
                \App\Models\TableSession::STATUS_ORDERING,
                \App\Models\TableSession::STATUS_PAYMENT_PENDING,
            ])
            ->exists();
    }

    /**
     * Check if table has active orders
     */
    public function hasActiveOrders(): bool
    {
        return $this->orders()
            ->where(function ($q) {
                $q->whereNull('order_status_id')
                    ->orWhereHas('orderStatus', function ($sq) {
                        $sq->whereNotIn('code', ['completed', 'cancelled']);
                    });
            })
            ->exists();
    }

    // ==================== STATUS METHODS ====================

    /**
     * Check if table is available for new customers
     */
    public function isAvailable(): bool
    {
        return $this->status === self::STATUS_AVAILABLE;
    }

    /**
     * Check if table is occupied
     */
    public function isOccupied(): bool
    {
        return $this->status === self::STATUS_OCCUPIED;
    }

    /**
     * Mark table as occupied
     */
    public function markOccupied(): bool
    {
        return $this->update(['status' => self::STATUS_OCCUPIED]);
    }

    /**
     * Mark table as available
     */
    public function markAvailable(): bool
    {
        return $this->update(['status' => self::STATUS_AVAILABLE]);
    }

    /**
     * Reset table status to available (used after payment/session close)
     */
    public function resetStatus(): bool
    {
        if (!$this->hasActiveSession() && !$this->hasActiveOrders()) {
            return $this->markAvailable();
        }
        return false;
    }

    // ==================== DISPLAY HELPERS ====================

    /**
     * Get display name with floor info
     */
    public function getDisplayNameAttribute(): string
    {
        $floorName = $this->floor?->name ?? "Floor {$this->floor_id}";
        return "{$floorName} - Table {$this->code}";
    }
}

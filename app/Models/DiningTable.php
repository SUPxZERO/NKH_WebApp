<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class DiningTable extends Model
{
    use HasFactory;

    protected $table = 'tables';

    // Table statuses
    const STATUS_AVAILABLE = 'available';
    const STATUS_RESERVED = 'reserved';
    const STATUS_OCCUPIED = 'occupied';
    const STATUS_UNAVAILABLE = 'unavailable';

    protected $fillable = [
        'floor_id',
        'code',
        'capacity',
        'status',
        'qr_token',
        'qr_generated_at',
        'qr_url',
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

    public function sessions(): HasMany
    {
        return $this->hasMany(TableSession::class, 'table_id');
    }

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

    /**
     * Get active sessions for this table
     */
    public function activeSessions(): HasMany
    {
        return $this->sessions()
            ->active()
            ->notExpired();
    }

    /**
     * Get the most recent active session
     */
    public function activeSession(): ?TableSession
    {
        return $this->activeSessions()
            ->orderBy('last_activity_at', 'desc')
            ->first();
    }

    /**
     * Check if table has any active session
     */
    public function hasActiveSession(): bool
    {
        return $this->activeSessions()->exists();
    }

    /**
     * Check if table has active orders
     */
    public function hasActiveOrders(): bool
    {
        return $this->orders()
            ->whereNotIn('status', ['completed', 'cancelled'])
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

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class PaymentAuditLog extends Model
{
    use HasFactory;

    /**
     * SECURITY: Audit logs are append-only (never editable)
     * All fields protected to ensure audit trail integrity
     */
    protected $guarded = [
        'id',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    // ==================== RELATIONSHIPS ====================

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // ==================== STATIC LOGGING METHOD ====================

    /**
     * Log a payment audit event
     *
     * @param Payment $payment The payment being audited
     * @param string $action The action performed (e.g., 'status_changed', 'completed', 'failed', 'cancelled')
     * @param string|null $oldValue Previous value/status
     * @param string|null $newValue New value/status
     * @param int|null $userId User who performed the action (defaults to authenticated user)
     * @param array|null $metadata Additional metadata for the log
     * @return self
     */
    public static function log(
        Payment $payment,
        string $action,
        ?string $oldValue = null,
        ?string $newValue = null,
        ?int $userId = null,
        ?array $metadata = null
    ): self {
        return static::create([
            'payment_id' => $payment->id,
            'user_id' => $userId ?? Auth::id(),
            'action' => $action,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'metadata' => $metadata,
        ]);
    }

    // ==================== SCOPES ====================

    public function scopeForPayment($query, $paymentId)
    {
        return $query->where('payment_id', $paymentId);
    }

    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Payment extends Model
{
    use HasFactory;

    // Payment statuses
    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';
    const STATUS_REFUNDED = 'refunded';
    const STATUS_CANCELLED = 'cancelled';

    /**
     * SECURITY: Use $guarded instead of $fillable to protect sensitive fields
     * 
     * These fields MUST NOT be settable via user input/API requests:
     * - Financial: amount, tip, cash_received, change_given, amount_in_base_currency
     * - Status: status (only service layer can update)
     * - Confirmation: confirmed_by, confirmed_at (only authorized staff)
     * - Gateway: gateway_reference, qr_reference (external system only)
     * - System: uuid, processed_at, initiated_at, expires_at
     * - Audit: retry_count, failure_reason
     * - Security: ip_address, user_agent, device_fingerprint
     * 
     * Attack prevented: User sending {"status": "completed", "amount": 0.01}
     */
    protected $guarded = [
        'id',
        'uuid',                     // ⚠️ System-generated identifier
        'amount',                   // ⚠️ CRITICAL: Cannot manipulate payment amount
        'tip',                      // ⚠️ User input, but validated separately
        'cash_received',            // ⚠️ Staff-only entry
        'change_given',             // ⚠️ Calculated field
        'confirmed_by',             // ⚠️ Set by auth system only
        'confirmed_at',             // ⚠️ Set by auth system only
        'amount_in_base_currency',  // ⚠️ Calculated based on exchange rate
        'status',                   // ⚠️ CRITICAL: Only PaymentService can update
        'failure_reason',           // ⚠️ System-set on failure
        'processed_at',             // ⚠️ System timestamp
        'initiated_at',             // ⚠️ System timestamp
        'expires_at',               // ⚠️ System-calculated expiry
        'retry_count',              // ⚠️ System-tracked retries
        'gateway_reference',        // ⚠️ External system reference
        'qr_reference',             // ⚠️ System-generated QR code
        'ip_address',               // ⚠️ Server-captured
        'user_agent',               // ⚠️ Server-captured
        'device_fingerprint',       // ⚠️ Server-calculated
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'cash_received' => 'decimal:2',
        'change_given' => 'decimal:2',
        'exchange_rate' => 'decimal:4',
        'amount_in_base_currency' => 'decimal:2',
        'initiated_at' => 'datetime',
        'processed_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'expires_at' => 'datetime',
        'metadata' => 'array',
        'retry_count' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($payment) {
            if (empty($payment->uuid)) {
                $payment->uuid = (string) Str::uuid();
            }
            if (empty($payment->initiated_at)) {
                $payment->initiated_at = now();
            }
        });
    }

    // ==================== RELATIONSHIPS ====================

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function method()
    {
        return $this->belongsTo(PaymentMethod::class, 'payment_method_id');
    }

    public function paymentMethod()
    {
        return $this->belongsTo(PaymentMethod::class, 'payment_method_id');
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function confirmedBy()
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    public function refunds()
    {
        return $this->hasMany(Refund::class);
    }

    public function auditLogs()
    {
        return $this->hasMany(PaymentAuditLog::class);
    }

    public function order()
    {
        return $this->hasOneThrough(
            Order::class,
            Invoice::class,
            'id', // Foreign key on invoices
            'id', // Foreign key on orders
            'invoice_id', // Local key on payments
            'order_id' // Local key on invoices
        );
    }

    // ==================== STATUS HELPERS ====================

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isProcessing(): bool
    {
        return $this->status === self::STATUS_PROCESSING;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    public function isRefunded(): bool
    {
        return $this->status === self::STATUS_REFUNDED;
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast() && $this->isPending();
    }

    public function canRetry(): bool
    {
        return $this->isFailed() && $this->retry_count < 3;
    }

    // ==================== AMOUNT HELPERS ====================

    public function getRefundedAmountAttribute(): float
    {
        return (float) $this->refunds()
            ->where('status', 'completed')
            ->sum('amount');
    }

    public function getRefundableAmountAttribute(): float
    {
        return max(0, (float) $this->amount - $this->refunded_amount);
    }

    public function isFullyRefunded(): bool
    {
        return $this->refunded_amount >= (float) $this->amount;
    }

    // ==================== SCOPES ====================

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    public function scopeFailed($query)
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    public function scopeExpired($query)
    {
        return $query->where('status', self::STATUS_PENDING)
            ->where('expires_at', '<', now());
    }

    public function scopeForInvoice($query, $invoiceId)
    {
        return $query->where('invoice_id', $invoiceId);
    }

    public function scopeByQrReference($query, $qrReference)
    {
        return $query->where('qr_reference', $qrReference);
    }

    public function scopeRecent($query, $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // ==================== UTILITY METHODS ====================

    public function markAsProcessing(): bool
    {
        $oldStatus = $this->status;
        $result = $this->update(['status' => self::STATUS_PROCESSING]);
        
        if ($result) {
            PaymentAuditLog::log($this, 'status_changed', $oldStatus, self::STATUS_PROCESSING);
        }
        
        return $result;
    }

    public function markAsCompleted(?string $gatewayReference = null): bool
    {
        $oldStatus = $this->status;
        $result = $this->update([
            'status' => self::STATUS_COMPLETED,
            'processed_at' => now(),
            'gateway_reference' => $gatewayReference ?? $this->gateway_reference,
        ]);
        
        if ($result) {
            PaymentAuditLog::log($this, 'completed', $oldStatus, self::STATUS_COMPLETED);
        }
        
        return $result;
    }

    public function markAsFailed(string $reason): bool
    {
        $oldStatus = $this->status;
        $result = $this->update([
            'status' => self::STATUS_FAILED,
            'failure_reason' => $reason,
            'retry_count' => $this->retry_count + 1,
        ]);
        
        if ($result) {
            PaymentAuditLog::log($this, 'failed', $oldStatus, self::STATUS_FAILED, null, [
                'reason' => $reason,
            ]);
        }
        
        return $result;
    }

    public function markAsCancelled(): bool
    {
        $oldStatus = $this->status;
        $result = $this->update(['status' => self::STATUS_CANCELLED]);
        
        if ($result) {
            PaymentAuditLog::log($this, 'cancelled', $oldStatus, self::STATUS_CANCELLED);
        }
        
        return $result;
    }
}

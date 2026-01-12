<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentAuditLog extends Model
{
    public $timestamps = false;

    /**
     * SECURITY: Payment audit logs are append-only
     * All fields protected for audit trail integrity
     */
    protected $guarded = [
        'id',
        'payment_id',           // ⚠️ CRITICAL: Which payment
        'action',               // ⚠️ CRITICAL: What happened  
        'old_status',           // ⚠️ Audit trail
        'new_status',           // ⚠️ Audit trail
        'amount_change',        // ⚠️ Financial audit
        'performed_by',         // ⚠️ Who did it
        'actor_type',           // ⚠️ User/system/webhook
        'ip_address',           // ⚠️ Audit trail
        'user_agent',           // ⚠️ Audit trail
        'metadata',             // ⚠️ Audit details
        'notes',                // ⚠️ Audit notes
        'created_at',           // ⚠️ When
    ];

    protected $casts = [
        'amount_change' => 'decimal:2',
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    // ==================== RELATIONSHIPS ====================

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }

    public function performer()
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    // ==================== FACTORY METHODS ====================

    public static function log(
        Payment $payment,
        string $action,
        ?string $oldStatus = null,
        ?string $newStatus = null,
        ?float $amountChange = null,
        array $metadata = []
    ): self {
        return self::create([
            'payment_id' => $payment->id,
            'action' => $action,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'amount_change' => $amountChange,
            'performed_by' => auth()->id(),
            'actor_type' => auth()->check() ? 'user' : 'system',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'metadata' => $metadata,
            'created_at' => now(),
        ]);
    }

    public static function logWebhook(
        Payment $payment,
        string $action,
        ?string $oldStatus = null,
        ?string $newStatus = null,
        array $webhookData = []
    ): self {
        return self::create([
            'payment_id' => $payment->id,
            'action' => $action,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'performed_by' => null,
            'actor_type' => 'webhook',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'metadata' => [
                'webhook_data' => $webhookData,
                'received_at' => now()->toIso8601String(),
            ],
            'created_at' => now(),
        ]);
    }
}

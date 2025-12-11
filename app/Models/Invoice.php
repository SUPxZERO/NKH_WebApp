<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    // Status constants
    const STATUS_DRAFT = 'draft';
    const STATUS_ISSUED = 'issued';
    const STATUS_PARTIAL = 'partial';
    const STATUS_PAID = 'paid';
    const STATUS_OVERDUE = 'overdue';
    const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'order_id',
        'location_id',
        'invoice_number',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'service_charge',
        'total_amount',
        'amount_paid',
        'amount_due',
        'currency',
        'status',
        'issued_at',
        'due_at',
        'paid_at',
        'notes'
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'service_charge' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'amount_due' => 'decimal:2',
        'issued_at' => 'datetime',
        'due_at' => 'datetime',
        'paid_at' => 'datetime'
    ];

    // ==================== RELATIONSHIPS ====================

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    // ==================== COMPUTED ATTRIBUTES ====================

    public function getCompletedAmountAttribute(): float
    {
        return (float) $this->payments()
            ->where('status', Payment::STATUS_COMPLETED)
            ->sum('amount');
    }

    public function getPendingAmountAttribute(): float
    {
        return (float) $this->payments()
            ->where('status', Payment::STATUS_PENDING)
            ->sum('amount');
    }

    public function getRemainingBalanceAttribute(): float
    {
        return max(0, (float) $this->total_amount - $this->completed_amount);
    }

    public function getPaymentProgressAttribute(): float
    {
        if ((float) $this->total_amount <= 0) {
            return 100;
        }
        return min(100, ($this->completed_amount / (float) $this->total_amount) * 100);
    }

    // ==================== STATUS HELPERS ====================

    public function isFullyPaid(): bool
    {
        return $this->remaining_balance <= 0;
    }

    public function isPartiallyPaid(): bool
    {
        return $this->completed_amount > 0 && !$this->isFullyPaid();
    }

    public function isPending(): bool
    {
        return $this->completed_amount <= 0 && $this->pending_amount > 0;
    }

    public function canAcceptPayment(): bool
    {
        return !$this->isFullyPaid() && $this->status !== self::STATUS_CANCELLED;
    }

    // ==================== SPLIT PAYMENT METHODS ====================

    /**
     * Record a payment and update invoice totals.
     */
    public function recordPayment(float $amount): void
    {
        $this->amount_paid = (float) $this->amount_paid + $amount;
        $this->amount_due = max(0, (float) $this->total_amount - $this->amount_paid);
        
        if ($this->amount_due <= 0) {
            $this->status = self::STATUS_PAID;
            $this->paid_at = now();
        } elseif ($this->amount_paid > 0) {
            $this->status = self::STATUS_PARTIAL;
        }
        
        $this->save();
    }

    /**
     * Get active (non-failed, non-cancelled) payments.
     */
    public function activePayments()
    {
        return $this->payments()
            ->whereNotIn('status', [Payment::STATUS_FAILED, Payment::STATUS_CANCELLED]);
    }

    /**
     * Check if a specific amount can be paid.
     */
    public function canPayAmount(float $amount): bool
    {
        return $amount > 0 && $amount <= $this->remaining_balance;
    }

    // ==================== SCOPES ====================

    public function scopeUnpaid($query)
    {
        return $query->whereIn('status', [self::STATUS_ISSUED, self::STATUS_PARTIAL]);
    }

    public function scopePaid($query)
    {
        return $query->where('status', self::STATUS_PAID);
    }

    public function scopePartial($query)
    {
        return $query->where('status', self::STATUS_PARTIAL);
    }
}


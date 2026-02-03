<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

class PaymentMethod extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'type',
        'description',
        'processing_fee',
        'display_order',
        'is_active',
        'configuration',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'processing_fee' => 'decimal:2',
        'display_order' => 'integer',
        'configuration' => 'array',
    ];

    /**
     * Get all payments using this method.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Get all audit logs for this payment method.
     */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(PaymentMethodAuditLog::class);
    }

    /**
     * Scope: Get only active payment methods.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Check if this payment method can be safely disabled.
     * 
     * @return bool
     */
    public function canBeDisabled(): bool
    {
        // Prevent disabling cash as a safety fallback
        if ($this->code === 'cash') {
            return false;
        }

        // Prevent disabling if it's the last active method
        $activeCount = static::where('is_active', true)->count();

        // If this method is currently active, we need at least one other active method
        if ($this->is_active && $activeCount <= 1) {
            return false;
        }

        return true;
    }

    /**
     * Toggle the active status of this payment method.
     * 
     * @return bool
     */
    public function toggle(): bool
    {
        // If trying to disable, check if it's safe
        if ($this->is_active && !$this->canBeDisabled()) {
            return false;
        }

        $oldStatus = $this->is_active;
        $this->is_active = !$this->is_active;
        $this->save();

        // Log the action
        PaymentMethodAuditLog::log(
            $this,
            $this->is_active ? 'enabled' : 'disabled',
            [
                'old_status' => $oldStatus,
                'new_status' => $this->is_active,
            ]
        );

        // Bust cache
        $this->bustCache();

        return true;
    }

    /**
     * Log an update to this payment method.
     * 
     * @param array $changes
     */
    public function logUpdate(array $changes): void
    {
        PaymentMethodAuditLog::log($this, 'updated', $changes);
        $this->bustCache();
    }

    /**
     * Clear the payment methods cache.
     */
    public function bustCache(): void
    {
        Cache::forget('payment_methods.active');
    }

    /**
     * Boot method to handle model events.
     */
    protected static function booted(): void
    {
        // Bust cache whenever a payment method is updated
        static::updated(function (PaymentMethod $paymentMethod) {
            $paymentMethod->bustCache();
        });
    }
}

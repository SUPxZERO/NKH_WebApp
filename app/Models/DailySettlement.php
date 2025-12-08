<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailySettlement extends Model
{
    use HasFactory;

    protected $fillable = [
        'location_id',
        'settlement_date',
        'total_orders',
        'total_revenue',
        'total_refunds',
        'net_revenue',
        'cash_total',
        'card_total',
        'qr_total',
        'other_total',
        'usd_total',
        'khr_total',
        'status',
        'discrepancy_amount',
        'reconciled_by',
        'reconciled_at',
        'notes',
        'metadata',
    ];

    protected $casts = [
        'settlement_date' => 'date',
        'total_orders' => 'integer',
        'total_revenue' => 'decimal:2',
        'total_refunds' => 'decimal:2',
        'net_revenue' => 'decimal:2',
        'cash_total' => 'decimal:2',
        'card_total' => 'decimal:2',
        'qr_total' => 'decimal:2',
        'other_total' => 'decimal:2',
        'usd_total' => 'decimal:2',
        'khr_total' => 'decimal:2',
        'discrepancy_amount' => 'decimal:2',
        'reconciled_at' => 'datetime',
        'metadata' => 'array',
    ];

    // ==================== RELATIONSHIPS ====================

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function reconciledBy()
    {
        return $this->belongsTo(User::class, 'reconciled_by');
    }

    // ==================== STATUS HELPERS ====================

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isReconciled(): bool
    {
        return $this->status === 'reconciled';
    }

    public function hasDiscrepancy(): bool
    {
        return $this->status === 'discrepancy';
    }

    public function isClosed(): bool
    {
        return $this->status === 'closed';
    }

    // ==================== SCOPES ====================

    public function scopeForDate($query, $date)
    {
        return $query->whereDate('settlement_date', $date);
    }

    public function scopeForLocation($query, $locationId)
    {
        return $query->where('location_id', $locationId);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeWithDiscrepancy($query)
    {
        return $query->where('status', 'discrepancy');
    }
}

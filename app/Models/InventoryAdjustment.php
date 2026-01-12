<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryAdjustment extends Model
{
    use HasFactory;

    protected $guarded = [
        'id',
        'ingredient_id',
        'location_id',
        'quantity_before',
        'quantity_after',
        'quantity_change',
        'reason',
        'notes',
        'status',
        'adjusted_by',
        'approved_by',
        'approved_at',
        'approval_notes',
        'rejected_by',
        'rejected_at',
        'rejection_reason'
            'created_at',
        'updated_at',
    ];

    protected $casts = [
        'quantity_before' => 'decimal:3',
        'quantity_after' => 'decimal:3',
        'quantity_change' => 'decimal:3',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function ingredient()
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function adjustedBy()
    {
        return $this->belongsTo(User::class, 'adjusted_by');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
    
    // Alias for frontend compatibility
    public function adjusted_by_employee()
    {
        return $this->belongsTo(User::class, 'adjusted_by');
    }
}

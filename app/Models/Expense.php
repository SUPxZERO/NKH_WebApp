<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    
    
    /**
     * SECURITY: Protect expense amounts and approval status
     */
    protected $guarded = [
        'id',
        'amount',               // ⚠️ CRITICAL: Expense amount
        'status',               // ⚠️ Workflow (\u0026 approval)
        'created_at',
        'updated_at',
    ];

    
    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    protected $casts = [
        'expense_date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function category()
    {
        return $this->belongsTo(ExpenseCategory::class, 'expense_category_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'payroll_id',
        'type',
        'description',
        'amount',
        'percentage',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'percentage' => 'decimal:2',
    ];

    // Relationships
    public function payroll()
    {
        return $this->belongsTo(Payroll::class);
    }

    // Scopes
    public function scopeEarnings($query)
    {
        return $query->where('type', 'earning');
    }

    public function scopeDeductions($query)
    {
        return $query->where('type', 'deduction');
    }

    public function scopeForPayroll($query, $payrollId)
    {
        return $query->where('payroll_id', $payrollId);
    }
}

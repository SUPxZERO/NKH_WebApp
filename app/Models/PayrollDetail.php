<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollDetail extends Model
{
    use HasFactory;

    protected $guarded = ['id', 'created_at', 'updated_at'];

    public function payroll()
    {
        return $this->belongsTo(Payroll::class);
    }

    // Scope for earnings
    public function scopeEarnings($query)
    {
        return $query->where('type', 'earning');
    }

    // Scope for deductions
    public function scopeDeductions($query)
    {
        return $query->where('type', 'deduction');
    }
}

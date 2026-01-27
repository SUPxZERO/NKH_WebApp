<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $employee_id
 * @property \Carbon\Carbon $period_start
 * @property \Carbon\Carbon $period_end
 * @property float $gross_pay
 * @property float $bonuses
 * @property float $deductions
 * @property float $net_pay
 * @property string $status
 * @property \Carbon\Carbon|null $paid_at
 */
class Payroll extends Model
{
    use HasFactory;

    /**
     * SECURITY: Protect payroll calculations
     * All salary amounts are system-calculated and workflow-managed
     */
    protected $guarded = [
        'id',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'gross_pay' => 'decimal:2',
        'bonuses' => 'decimal:2',
        'deductions' => 'decimal:2',
        'net_pay' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function details()
    {
        return $this->hasMany(PayrollDetail::class);
    }
}

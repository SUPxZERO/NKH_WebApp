<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttendanceMetric extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'attendance_id',
        'minutes_late',
        'minutes_early_departure',
        'break_duration_minutes',
        'total_shift_hours',
        'overtime_hours',
        'notes',
    ];

    protected $casts = [
        'total_shift_hours' => 'decimal:2',
        'overtime_hours' => 'decimal:2',
    ];

    // Relationships
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function attendance()
    {
        return $this->belongsTo(Attendance::class);
    }

    // Scopes
    public function scopeForEmployee($query, $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }

    public function scopeLate($query)
    {
        return $query->where('minutes_late', '>', 0);
    }

    public function scopeWithOvertime($query)
    {
        return $query->where('overtime_hours', '>', 0);
    }

    // Accessors
    public function getLateStatusAttribute()
    {
        if ($this->minutes_late > 0) {
            return 'late';
        } elseif ($this->minutes_early_departure > 0) {
            return 'early_departure';
        }
        return 'on_time';
    }
}

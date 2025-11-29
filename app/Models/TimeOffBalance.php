<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TimeOffBalance extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'year',
        'vacation_hours_available',
        'vacation_hours_used',
        'sick_hours_available',
        'sick_hours_used',
        'personal_hours_available',
        'personal_hours_used',
    ];

    protected $casts = [
        'vacation_hours_available' => 'decimal:2',
        'vacation_hours_used' => 'decimal:2',
        'sick_hours_available' => 'decimal:2',
        'sick_hours_used' => 'decimal:2',
        'personal_hours_available' => 'decimal:2',
        'personal_hours_used' => 'decimal:2',
    ];

    // Relationships
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    // Scopes
    public function scopeForEmployee($query, $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }

    public function scopeForYear($query, $year)
    {
        return $query->where('year', $year);
    }

    // Accessors
    public function getVacationRemainingAttribute()
    {
        return $this->vacation_hours_available - $this->vacation_hours_used;
    }

    public function getSickRemainingAttribute()
    {
        return $this->sick_hours_available - $this->sick_hours_used;
    }

    public function getPersonalRemainingAttribute()
    {
        return $this->personal_hours_available - $this->personal_hours_used;
    }

    public function getTotalRemainingAttribute()
    {
        return $this->vacation_remaining + $this->sick_remaining + $this->personal_remaining;
    }
}

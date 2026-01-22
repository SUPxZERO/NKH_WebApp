<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    use HasFactory;

    /**
     * SECURITY: Use $guarded to protect shift payroll data
     * 
     * Protected fields:
     * - Payroll: calculated_hours, actual_start_time, actual_end_time (time tracking system)
     * - Workflow: status, published_at (manager-only actions)
     */
    protected $guarded = [
        'id',
        'calculated_hours',      // ⚠️ System-calculated for payroll
        'actual_start_time',     // ⚠️ Time clock system only
        'actual_end_time',       // ⚠️ Time clock system only
        'status',                // ⚠️ Workflow-managed (scheduled/in-progress/completed/cancelled)
        'published_at',          // ⚠️ Manager-only publish action
        'created_at',
        'updated_at',
    ];


    protected $table = 'shifts';

    protected $casts = [
        'date' => 'date',
        'published_at' => 'datetime',
    ];

    // Relationships
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function position()
    {
        return $this->belongsTo(Position::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function swaps()
    {
        return $this->hasMany(ShiftSwap::class);
    }

    /* DEAD CODE: AttendanceMetric class missing & no shift_id in attendances table
    public function attendanceMetrics()
    {
        return $this->hasMany(AttendanceMetric::class);
    }
    */

    // Scopes
    public function scopePublished($query)
    {
        return $query->whereNotNull('published_at');
    }

    public function scopeUnpublished($query)
    {
        return $query->whereNull('published_at');
    }

    public function scopeScheduled($query)
    {
        return $query->where('status', 'scheduled');
    }

    public function scopeForLocation($query, $locationId)
    {
        return $query->where('location_id', $locationId);
    }

    public function scopeForEmployee($query, $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }

    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    // Accessors
    public function getDurationMinutesAttribute()
    {
        if ($this->start_time && $this->end_time) {
            $start = \Carbon\Carbon::createFromTimeString($this->start_time);
            $end = \Carbon\Carbon::createFromTimeString($this->end_time);
            return $start->diffInMinutes($end);
        }
        return 0;
    }

    public function getDurationHoursAttribute()
    {
        return round($this->duration_minutes / 60, 2);
    }

    public function getIsPublishedAttribute()
    {
        return $this->published_at !== null;
    }
}

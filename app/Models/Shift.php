<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'position_id',
        'location_id',
        'date',
        'start_time',
        'end_time',
        'status',
        'notes',
        'actual_start_time',
        'actual_end_time',
        'calculated_hours',
        'published_at',
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

    public function attendanceMetrics()
    {
        return $this->hasMany(AttendanceMetric::class);
    }

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

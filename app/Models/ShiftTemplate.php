<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShiftTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'location_id',
        'position_id',
        'name',
        'day_of_week',
        'start_time',
        'end_time',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'day_of_week' => 'integer',
    ];

    // Relationships
    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function position()
    {
        return $this->belongsTo(Position::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForLocation($query, $locationId)
    {
        return $query->where('location_id', $locationId);
    }

    public function scopeForDayOfWeek($query, $dayOfWeek)
    {
        return $query->where('day_of_week', $dayOfWeek);
    }

    // Accessors
    public function getDayNameAttribute()
    {
        $days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return $days[$this->day_of_week] ?? 'Unknown';
    }

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
}

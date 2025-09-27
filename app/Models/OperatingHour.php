<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OperatingHour extends Model
{
    use HasFactory;

    protected $fillable = [
        'location_id',
        'day_of_week',
        'service_type',
        'opening_time',
        'closing_time',
    ];

    public function location()
    {
        return $this->belongsTo(Location::class);
    }
}

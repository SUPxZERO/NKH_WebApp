<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OperatingHours extends Model
{
    use HasFactory;

    protected $guarded = [
        'id',
        'location_id',
        'day_of_week',
        'service_type',
        'opening_time',
        'closing_time',
            'created_at',
        'updated_at',
    ];

    protected $casts = [
        'day_of_week' => 'integer',
    ];

    public function location()
    {
        return $this->belongsTo(Location::class);
    }
}

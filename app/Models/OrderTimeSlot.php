<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderTimeSlot extends Model
{
    use HasFactory;

    protected $fillable = [
        'location_id',
        'slot_date',
        'slot_start_time',
        'slot_type',
        'max_orders',
        'current_orders',
    ];

    protected $casts = [
        'slot_date' => 'date',
        'max_orders' => 'integer',
        'current_orders' => 'integer',
    ];

    public function location()
    {
        return $this->belongsTo(Location::class);
    }
}

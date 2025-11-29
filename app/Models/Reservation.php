<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'location_id',
        'table_id',
        'customer_id',
        'code',
        'reservation_number',
        'reserved_for',
        'party_size',
        'reservation_date',
        'reservation_time',
        'duration_minutes',
        'guest_count',
        'status',
        'special_requests',
        'notes',
    ];

    protected $casts = [
        'reservation_date' => 'date',
        'party_size' => 'integer',
        'duration_minutes' => 'integer',
        'guest_count' => 'integer',
    ];

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function table()
    {
        return $this->belongsTo(DiningTable::class, 'table_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}

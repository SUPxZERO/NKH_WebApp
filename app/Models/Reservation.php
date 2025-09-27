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
        'reserved_for',
        'duration_minutes',
        'guest_count',
        'status',
        'notes',
    ];

    protected $casts = [
        'reserved_for' => 'datetime',
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

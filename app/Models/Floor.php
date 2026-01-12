<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Floor extends Model
{
    use HasFactory;

    protected $guarded = [
        'id',
        'location_id',
        'name',
        'display_order',
        'is_active',
            'created_at',
        'updated_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function tables()
    {
        return $this->hasMany(DiningTable::class, 'floor_id');
    }
}

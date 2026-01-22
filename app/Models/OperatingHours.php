<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OperatingHours extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'day_of_week' => 'integer',
    ];

    public function location()
    {
        return $this->belongsTo(Location::class);
    }
}

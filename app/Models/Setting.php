<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'location_id',
        'key',
        'value',
    ];

    protected $casts = [
        'value' => 'array',
    ];

    public function location()
    {
        return $this->belongsTo(Location::class);
    }
}

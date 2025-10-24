<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'display_name', 
        'base_unit',
        'conversion_factor',
        'is_base_unit',
        'for_weight',
        'for_volume', 
        'for_quantity',
        'for_packaging',
        'for_produce'
    ];

    protected $casts = [
        'is_base_unit' => 'boolean',
        'for_weight' => 'boolean',
        'for_volume' => 'boolean',
        'for_quantity' => 'boolean',
        'for_packaging' => 'boolean',
        'for_produce' => 'boolean',
        'conversion_factor' => 'decimal:3'
    ];

    public function baseUnit()
    {
        return $this->belongsTo(Unit::class, 'base_unit', 'code');
    }

    public function derivedUnits()
    {
        return $this->hasMany(Unit::class, 'base_unit', 'code');
    }
}
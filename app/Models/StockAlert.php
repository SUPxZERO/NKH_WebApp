<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockAlert extends Model
{
    use HasFactory;

    protected $guarded = [
        'id',
        'type',
        'ingredient_id',
        'location_id',
        'severity',
        'message',
        'acknowledged',
        'acknowledged_at',
        'acknowledged_by',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'acknowledged' => 'boolean',
        'acknowledged_at' => 'datetime',
    ];

    public function ingredient()
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function acknowledgedBy()
    {
        return $this->belongsTo(User::class, 'acknowledged_by');
    }
}

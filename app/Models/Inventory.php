<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    use HasFactory;

    protected $table = 'inventory';

    protected $guarded = [
        'id',
        // 'ingredient_id', // Allowed
        // 'location_id',   // Allowed
        // 'quantity',      // Allowed
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'expiration_date' => 'date'
    ];

    public function ingredient()
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }
}

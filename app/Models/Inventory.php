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
        'ingredient_id',
        'location_id',
        'quantity',
        'batch_number',
        'expiration_date'
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

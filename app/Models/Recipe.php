<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Recipe extends Model
{
    use HasFactory;

    protected $guarded = [
        'id',
        'menu_item_id',
        'name',
        'description',
        'instructions',
        'prep_time_minutes',
        'cook_time_minutes',
        'servings',
        'yield_portions',
        'is_active',
        'total_cost',
            'created_at',
        'updated_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'prep_time_minutes' => 'integer',
        'cook_time_minutes' => 'integer',
        'servings' => 'integer',
        'yield_portions' => 'integer',
        'total_cost' => 'decimal:2',
    ];

    public function menuItem()
    {
        return $this->belongsTo(MenuItem::class);
    }

    public function ingredients()
    {
        return $this->hasMany(RecipeIngredient::class);
    }
}


<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Recipe extends Model
{
    use HasFactory;

    protected $fillable = [
        'menu_item_id',
        'yield_portions',
        'instructions',
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

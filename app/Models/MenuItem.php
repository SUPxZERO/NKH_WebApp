<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MenuItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'location_id',
        'category_id',
        'sku',
        'slug',
        'price',
        'cost',
        'image_path',
        'is_popular',
        'is_active',
        'display_order',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'cost' => 'decimal:2',
        'is_popular' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function translations()
    {
        return $this->hasMany(MenuItemTranslation::class);
    }

    public function recipe()
    {
        return $this->hasOne(Recipe::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MenuItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $with = ['translations'];

    protected $fillable = [
        'location_id',
        'category_id',
        'name',
        'sku',
        'slug',
        'price',
        'cost',
        'image_path',
        'image',
        'is_popular',
        'is_active',
        'display_order',
        'prep_time',
        'calories',
    ];
    
    protected static function boot()
    {
        parent::boot();
        
        static::addGlobalScope('active', function ($query) {
            $query->where('is_active', true);
        });
        
        static::addGlobalScope('ordered', function ($query) {
            $query->orderBy('display_order', 'asc');
        });
    }

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

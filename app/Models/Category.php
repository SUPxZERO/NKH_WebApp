<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Category extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'location_id',
        'parent_id',
        'slug',
        'display_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function translations()
    {
        return $this->hasMany(CategoryTranslation::class);
    }

    public function menuItems()
    {
        return $this->hasMany(MenuItem::class);
    }

    /**
     * Get the parent category of this category
     */
    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    /**
     * Get the child categories of this category
     */
    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id');
    }
}

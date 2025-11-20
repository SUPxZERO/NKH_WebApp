<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{

    protected $fillable = [
        'location_id',
        'parent_id',
        'slug',
        'display_order',
        'is_active',
        'image',
    ];

    protected $with = ['translations'];
    
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
    
    public function scopeParents($query)
    {
        return $query->whereNull('parent_id');
    }
    
    protected static function boot()
    {
        parent::boot();
        static::addGlobalScope('ordered', function ($query) {
            $query->orderBy('display_order', 'asc');
        });
    }

    public function getNameAttribute()
    {
        return $this->translations->where('locale', app()->getLocale())->first()?->name ?? '';
    }

    public function getDescriptionAttribute()
    {
        return $this->translations->where('locale', app()->getLocale())->first()?->description ?? '';
    }

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

    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    public function childrenRecursive()
    {
        return $this->children()->with('childrenRecursive');
    }
}

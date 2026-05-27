<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Services\CacheService; // Sprint 1: Cache invalidation
use Illuminate\Support\Facades\Log;

/**
 * @property int $id
 * @property int $location_id
 * @property int $category_id
 * @property string $name
 * @property string $sku
 * @property string $slug
 * @property float $price
 * @property float $cost
 * @property string|null $image_path
 * @property string|null $image
 * @property bool $is_popular
 * @property bool $is_active
 * @property int $display_order
 * @property int $prep_time
 * @property int $cook_time
 * @property int $calories
 * @property array|null $nutrition
 * @property array|null $ingredients
 * @property array|null $allergens
 * @property array|null $dietary_tags
 * @property string|null $serving_size
 * @property int $spice_level
 * @property string $availability_status
 * @property string|null $availability_note
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class MenuItem extends Model
{
    use HasFactory, SoftDeletes, \App\Traits\BranchScopable;

    protected $appends = ['name', 'description'];
    protected $with = ['translations'];

    /**
     * SECURITY: Use $guarded instead of $fillable to protect sensitive fields
     * 
     * These fields MUST NOT be settable via user input:
     * - Financial: cost (internal pricing)
     * - System-derived: rating, reviews_count
     * 
     * Admin/Manager can edit most fields, but cost should be admin-only
     */
    protected $guarded = [
        'id',
        'rating',                  // ⚠️ System-calculated from reviews
        'reviews_count',           // ⚠️ System-counted
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    protected static function boot()
    {
        parent::boot();

        /*
        static::addGlobalScope('active', function ($query) {
            $query->where('is_active', true);
        });
        */

        static::addGlobalScope('ordered', function ($query) {
            $query->orderBy('display_order', 'asc');
        });

        static::saved(function ($item) {
            app(\App\Services\CacheService::class)->invalidateHomepage();
            app(\App\Services\CacheService::class)->invalidateMenuItem($item->id);
            if ($item->location_id) {
                app(\App\Services\CacheService::class)->invalidateMenu($item->location_id);
            }
        });

        static::deleted(function ($item) {
            app(\App\Services\CacheService::class)->invalidateHomepage();
            app(\App\Services\CacheService::class)->invalidateMenuItem($item->id);
            if ($item->location_id) {
                app(\App\Services\CacheService::class)->invalidateMenu($item->location_id);
            }
        });
    }

    protected $casts = [
        'price' => 'decimal:2',
        'cost' => 'decimal:2',
        'rating' => 'float',
        'is_popular' => 'boolean',
        'is_featured' => 'boolean',
        'is_active' => 'boolean',
        'reviews_count' => 'integer',
        'featured_order' => 'integer',
        'display_order' => 'integer',
        'prep_time' => 'integer',
        'cook_time' => 'integer',
        'calories' => 'integer',
        'spice_level' => 'integer',
        'nutrition' => 'array',
        'ingredients' => 'array',
        'allergens' => 'array',
        'dietary_tags' => 'array',
    ];

    /**
     * Scope to filter only active menu items
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

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

    /**
     * Get the name attribute from translations.
     *
     * @return string
     */
    public function getNameAttribute(): string
    {
        $translation = $this->getTranslation();
        return $translation ? $translation->name : ($this->slug ?? 'Unknown Item');
    }

    /**
     * Get the description attribute from translations.
     *
     * @return string|null
     */
    public function getDescriptionAttribute(): ?string
    {
        $translation = $this->getTranslation();
        return $translation ? $translation->description : null;
    }

    /**
     * Get the best available translation.
     *
     * @return \App\Models\MenuItemTranslation|null
     */
    protected function getTranslation(): ?MenuItemTranslation
    {
        // Try to get translation for current locale
        $translation = $this->translations->firstWhere('locale', app()->getLocale());

        // Fallback to English
        if (!$translation) {
            $translation = $this->translations->firstWhere('locale', 'en');
        }

        // Fallback to any translation
        if (!$translation) {
            $translation = $this->translations->first();
        }

        return $translation;
    }

    /**
     * Get total prep + cook time.
     *
     * @return int|null
     */
    public function getTotalTimeAttribute(): ?int
    {
        $prep = $this->prep_time ?? 0;
        $cook = $this->cook_time ?? 0;
        return ($prep + $cook) > 0 ? ($prep + $cook) : null;
    }

    /**
     * Check if item is available for ordering.
     *
     * @return bool
     */
    public function isAvailable(): bool
    {
        return $this->is_active && $this->availability_status === 'available';
    }
}

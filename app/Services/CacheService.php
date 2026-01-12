<?php

namespace App\Services;

use App\Models\MenuItem;
use App\Models\Category;
use App\Models\Location;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Cache Service
 * 
 * Sprint 1: Scalability Foundation
 * Centralized caching layer for frequently accessed data
 */
class CacheService
{
    // Cache TTL constants (in seconds)
    const TTL_MENU = 3600;        // 1 hour
    const TTL_CATEGORIES = 7200;   // 2 hours
    const TTL_LOCATIONS = 86400;   // 24 hours
    const TTL_SETTINGS = 86400;    // 24 hours

    /**
     * Get cached menu items for a location
     */
    /**
     * Get cached menu items for a location
     */
    public function getMenu(int $locationId): Collection
    {
        // Removed tags() as database driver doesn't support them
        return Cache::remember("menu:{$locationId}", self::TTL_MENU, function () use ($locationId) {
            Log::debug("Cache MISS: menu:{$locationId}");
            
            return MenuItem::with([
                'category.translations',
                'translations',
                'recipe.ingredients.unit'
            ])
            ->whereHas('category', fn($q) => $q->where('location_id', $locationId))
            ->where('is_active', true)
            ->where('availability_status', 'available') // Fixed: was is_available (which is a method, not a column)
            ->orderBy('display_order')
            ->get();
        });
    }

    /**
     * Get cached categories for a location
     */
    public function getCategories(?int $locationId = null): Collection
    {
        $cacheKey = $locationId ? "categories:{$locationId}" : "categories:all";
        
        return Cache::remember($cacheKey, self::TTL_CATEGORIES, function () use ($locationId) {
            Log::debug("Cache MISS: {$locationId}");
            
            $query = Category::with('translations')
                ->where('is_active', true)
                ->orderBy('display_order');

            if ($locationId) {
                $query->where('location_id', $locationId);
            }

            return $query->get();
        });
    }

    /**
     * Get all active locations (rarely changes)
     */
    public function getLocations(): Collection
    {
        return Cache::remember('locations:all', self::TTL_LOCATIONS, function () {
            Log::debug("Cache MISS: locations:all");
            
            return Location::where('is_active', true)
                ->orderBy('name')
                ->get();
        });
    }

    /**
     * Get menu item by ID with caching
     */
    public function getMenuItem(int $menuItemId): ?MenuItem
    {
        return Cache::remember("menu_item:{$menuItemId}", self::TTL_MENU, function () use ($menuItemId) {
            Log::debug("Cache MISS: menu_item:{$menuItemId}");
            
            return MenuItem::with([
                'category.translations',
                'translations',
                'recipe.ingredients.unit'
            ])->find($menuItemId);
        });
    }

    /**
     * Invalidate menu cache for a location
     */
    public function invalidateMenu(?int $locationId = null): void
    {
        if ($locationId) {
            Cache::forget("menu:{$locationId}");
            Log::info("Cache invalidated: menu for location {$locationId}");
        } else {
            // Cannot easily clear "all" without tags, so we rely on key expiry
            // or specific clears if we track keys. For now, specific invalidation is key.
            // If strictly needed, we could run a pattern match delete but that's expensive.
        }
    }

    /**
     * Invalidate categories cache
     */
    public function invalidateCategories(?int $locationId = null): void
    {
        if ($locationId) {
            Cache::forget("categories:{$locationId}");
            Log::info("Cache invalidated: categories for location {$locationId}");
        } else {
            Cache::forget("categories:all");
            Log::info("Cache invalidated: all categories");
        }
    }

    /**
     * Invalidate specific menu item cache
     */
    public function invalidateMenuItem(int $menuItemId): void
    {
        Cache::forget("menu_item:{$menuItemId}");
        Log::info("Cache invalidated: menu_item:{$menuItemId}");
    }

    /**
     * Invalidate locations cache
     */
    public function invalidateLocations(): void
    {
        Cache::forget('locations:all');
        Log::info("Cache invalidated: locations");
    }

    /**
     * Clear all application cache
     */
    public function clearAll(): void
    {
        Cache::flush();
        Log::warning("Cache cleared: ALL");
    }

    /**
     * Get cache statistics
     */
    public function getStats(): array
    {
        $hits = Cache::get('cache_hits', 0);
        $misses = Cache::get('cache_misses', 0);
        $total = $hits + $misses;

        return [
            'hits' => $hits,
            'misses' => $misses,
            'total_requests' => $total,
            'hit_rate' => $total > 0 ? round(($hits / $total) * 100, 2) : 0,
        ];
    }

    /**
     * Increment cache hit counter
     */
    protected function incrementHits(): void
    {
        Cache::increment('cache_hits');
    }

    /**
     * Increment cache miss counter
     */
    protected function incrementMisses(): void
    {
        Cache::increment('cache_misses');
    }
}

<?php

declare(strict_types=1);

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

/**
 * HasLocation Trait
 *
 * AUDIT FIX: Provides a standardized, explicit branch-filtering scope on any
 * Eloquent model that has a `location_id` column. Without this, each controller
 * manually adds ->where('location_id', $id), and any controller that forgets
 * leaks cross-branch data.
 *
 * USAGE on a model:
 *   use App\Traits\HasLocation;
 *   class MenuItem extends Model {
 *       use HasLocation;
 *   }
 *
 * USAGE in a controller / service:
 *   MenuItem::forLocation(1)->active()->get();
 *
 * NOTE: This is NOT a global scope (which would break admin "view all" queries).
 * It's an explicit named scope that must be applied intentionally. This is safer
 * for an admin system where cross-branch visibility is sometimes needed.
 */
trait HasLocation
{
    /**
     * Filter results to a single branch/location.
     *
     * @param  Builder  $query
     * @param  int|null $locationId  — if null, no filter is applied (allows all-branch admin views)
     * @return Builder
     */
    public function scopeForLocation(Builder $query, ?int $locationId): Builder
    {
        if ($locationId === null) {
            return $query;
        }

        return $query->where($this->getTable() . '.location_id', $locationId);
    }

    /**
     * Assert that a model belongs to the given location.
     * Useful in policies or controllers to guard against cross-branch access.
     *
     * @param  int  $locationId
     * @return bool
     */
    public function belongsToLocation(int $locationId): bool
    {
        return (int) $this->location_id === $locationId;
    }
}

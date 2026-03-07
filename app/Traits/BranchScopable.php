<?php

namespace App\Traits;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * BranchScopable Trait
 * 
 * Provides query scopes for filtering data by branch (location).
 * Models using this trait must have a `location_id` column (or override `getBranchColumn()`).
 * 
 * Usage:
 *   Model::forBranch($locationId)->get();
 *   Model::forUserBranch($user)->get();
 */
trait BranchScopable
{
    /**
     * Boot the trait and apply the global branch scope.
     */
    protected static function bootBranchScopable(): void
    {
        static::addGlobalScope('branch_scope', function (Builder $builder) {
            // Only apply scope if we are in an authenticated session (usually admin/api)
            if (auth()->check()) {
                /** @var \App\Models\User $user */
                $user = auth()->user();

                // Allow super-admin/admin to see everything unless a specific branch is selected
                if ($user->canViewAllBranches()) {
                    $activeBranchId = $user->getActiveBranchId();
                    if ($activeBranchId !== null) {
                        $builder->where($builder->getModel()->getTable() . '.' . $builder->getModel()->getBranchColumn(), $activeBranchId);
                    }
                    return;
                }

                // For other roles, restrict to their assigned branches
                // AUDIT FIX: Use withoutGlobalScope to prevent recursion if this trait is on Location model
                $locationIds = $user->locations()
                    ->withoutGlobalScope('branch_scope')
                    ->pluck('locations.id')
                    ->toArray();

                // Fallback to employee/user default if pivot is empty
                if (empty($locationIds)) {
                    $fallbackId = $user->employee?->location_id ?? $user->default_location_id;
                    if ($fallbackId) {
                        $locationIds = [$fallbackId];
                    }
                }

                if (!empty($locationIds)) {
                    $builder->whereIn($builder->getModel()->getTable() . '.' . $builder->getModel()->getBranchColumn(), $locationIds);
                } else {
                    // No access to any branch - force no results
                    $builder->whereRaw('1 = 0');
                }
            }
        });
    }

    /**
     * Get the column name used for branch scoping.
     */
    public function getBranchColumn(): string
    {
        return 'location_id';
    }

    /**
     * Scope query to a specific branch (for manual overrides).
     */
    public function scopeForBranch(Builder $query, ?int $locationId): Builder
    {
        if ($locationId === null) {
            return $query;
        }

        return $query->where($this->getBranchColumn(), $locationId);
    }
}

<?php

namespace App\Services;

use App\Models\Location;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Session;

/**
 * BranchSessionService
 * 
 * Manages the active branch (location) in the user's session.
 * Super-admin/admin can switch between branches freely.
 * Other roles are locked to their assigned location(s).
 */
class BranchSessionService
{
    private const SESSION_KEY = 'active_branch_id';

    /**
     * Set the active branch for the current session.
     * Returns true if set successfully, false if user doesn't have access.
     */
    public function setActiveBranch(?int $locationId, User $user): bool
    {
        // Null means "all branches" — only super-admin/admin can do this
        if ($locationId === null) {
            if (!$user->canViewAllBranches()) {
                return false;
            }
            Session::put(self::SESSION_KEY, null);
            return true;
        }

        // Verify the location exists
        if (!Location::where('id', $locationId)->exists()) {
            return false;
        }

        // Super-admin/admin can access any branch
        if ($user->canViewAllBranches()) {
            Session::put(self::SESSION_KEY, $locationId);
            return true;
        }

        // Other roles: verify they have access to this branch
        if ($user->canAccessBranch($locationId)) {
            Session::put(self::SESSION_KEY, $locationId);
            return true;
        }

        return false;
    }

    /**
     * Get the currently active branch ID from session.
     * Returns null if no branch is selected (means "all" for super-admin/admin).
     */
    public function getActiveBranch(): ?int
    {
        return Session::get(self::SESSION_KEY);
    }

    /**
     * Get all branches accessible to a user.
     */
    public function getUserBranches(User $user): Collection
    {
        if ($user->canViewAllBranches()) {
            return Location::active()
                ->select('id', 'name', 'code')
                ->orderBy('name')
                ->get();
        }

        // Get from user_locations pivot
        $locations = $user->locations()
            ->select('locations.id', 'locations.name', 'locations.code')
            ->orderBy('locations.name')
            ->get();

        // Fallback to employee/default location if no pivot records
        if ($locations->isEmpty()) {
            $fallbackId = $user->employee?->location_id ?? $user->default_location_id;
            if ($fallbackId) {
                $locations = Location::where('id', $fallbackId)
                    ->select('id', 'name', 'code')
                    ->get();
            }
        }

        return $locations;
    }

    /**
     * Clear the active branch from session.
     */
    public function clearActiveBranch(): void
    {
        Session::forget(self::SESSION_KEY);
    }
}

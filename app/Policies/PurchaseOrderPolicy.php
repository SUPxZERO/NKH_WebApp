<?php

namespace App\Policies;

use App\Models\PurchaseOrder;
use App\Models\User;

/**
 * AUDIT FIX: Added missing model policy.
 * Enforces branch isolation for PurchaseOrder viewing and modification.
 */
class PurchaseOrderPolicy
{
    /**
     * Intercept all checks for admins.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasAnyRole(['admin', 'super-admin'])) {
            return true;
        }

        return null; // proceed to regular checks
    }

    public function viewAny(User $user): bool
    {
        return $user->hasPermission('view-purchase-orders');
    }

    public function view(User $user, PurchaseOrder $purchaseOrder): bool
    {
        if (!$user->hasPermission('view-purchase-orders'))
            return false;

        // Branch isolation
        return $user->default_location_id === $purchaseOrder->location_id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('create-purchase-orders');
    }

    public function update(User $user, PurchaseOrder $purchaseOrder): bool
    {
        if (!$user->hasPermission('edit-purchase-orders'))
            return false;

        return $user->default_location_id === $purchaseOrder->location_id;
    }

    public function delete(User $user, PurchaseOrder $purchaseOrder): bool
    {
        if (!$user->hasPermission('delete-purchase-orders'))
            return false;

        return $user->default_location_id === $purchaseOrder->location_id;
    }
}

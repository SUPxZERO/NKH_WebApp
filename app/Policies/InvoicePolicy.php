<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;

/**
 * AUDIT FIX: Added missing model policy.
 * Enforces branch isolation for Invoice viewing and modification.
 */
class InvoicePolicy
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
        return $user->hasPermission('view-invoices');
    }

    public function view(User $user, Invoice $invoice): bool
    {
        if (!$user->hasPermission('view-invoices'))
            return false;

        // Branch isolation
        return $user->default_location_id === $invoice->location_id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('create-invoices');
    }

    public function update(User $user, Invoice $invoice): bool
    {
        if (!$user->hasPermission('edit-invoices'))
            return false;

        return $user->default_location_id === $invoice->location_id;
    }

    public function delete(User $user, Invoice $invoice): bool
    {
        if (!$user->hasPermission('delete-invoices'))
            return false;

        return $user->default_location_id === $invoice->location_id;
    }
}

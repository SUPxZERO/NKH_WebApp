<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('orders.view') || $user->hasRole('customer');
    }

    public function view(User $user, Order $order): bool
    {
        // Staff with permission or customer viewing own order
        if ($user->hasPermission('orders.view')) {
            return true;
        }
        if ($user->customer && $order->customer_id === optional($user->customer)->id) {
            return true;
        }
        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('orders.create') || $user->hasRole('customer');
    }

    public function update(User $user, Order $order): bool
    {
        return $user->hasPermission('orders.update');
    }

    public function delete(User $user, Order $order): bool
    {
        return $user->hasPermission('orders.delete');
    }
}

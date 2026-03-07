<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Public order updates channel
Broadcast::channel('orders', function () {
    return true;
});

// Public kitchen updates channel
Broadcast::channel('kitchen', function () {
    return true;
});

// Private channel for individual customer notifications
Broadcast::channel('customer.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Private channel for admin notifications
Broadcast::channel('admin-notifications', function ($user) {
    return in_array($user->role, ['admin', 'manager']);
});

// Private channel for reservation updates
Broadcast::channel('admin-reservations', function ($user) {
    return in_array($user->role, ['admin', 'manager', 'waiter']);
});

// Private channel for employee notifications
Broadcast::channel('employee.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

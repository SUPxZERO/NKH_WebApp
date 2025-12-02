<?php
$user = App\Models\User::with('customer')->find(2);
if ($user) {
    echo "User found: " . $user->name . "\n";
    if ($user->customer) {
        echo "Customer found. Points: " . $user->customer->points_balance . "\n";
    } else {
        echo "No customer record.\n";
    }
} else {
    echo "User 2 not found.\n";
}

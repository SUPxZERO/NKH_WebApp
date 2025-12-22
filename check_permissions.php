<?php

require 'vendor/autoload.php';
require 'bootstrap/app.php';

use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;

$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "\n=== PERMISSION DIAGNOSTIC ===\n\n";

// Check if permissions exist
echo "1. Checking notification permissions...\n";
$notificationPerms = Permission::whereIn('slug', ['notifications.view', 'notifications.send'])->get();
echo "Found " . $notificationPerms->count() . " notification permissions\n";
foreach ($notificationPerms as $perm) {
    echo "  - {$perm->slug}: {$perm->name}\n";
}

// Check admin role
echo "\n2. Checking admin role...\n";
$adminRole = Role::where('slug', 'admin')->first();
if ($adminRole) {
    echo "Admin role found: {$adminRole->name}\n";
    $adminPerms = $adminRole->permissions()->whereIn('slug', ['notifications.view', 'notifications.send'])->get();
    echo "Admin has " . $adminPerms->count() . " notification permissions\n";
    foreach ($adminPerms as $perm) {
        echo "  - {$perm->slug}\n";
    }
} else {
    echo "Admin role NOT found\n";
}

// Check current users
echo "\n3. Checking admin users...\n";
$adminUsers = User::with('roles')->whereHas('roles', fn($q) => $q->whereIn('slug', ['admin', 'super-admin', 'chief']))->get();
echo "Found " . $adminUsers->count() . " admin users\n";
foreach ($adminUsers as $user) {
    echo "  - {$user->email}\n";
    foreach ($user->roles as $role) {
        echo "    Role: {$role->slug}\n";
        $userPerms = $role->permissions()->whereIn('slug', ['notifications.view', 'notifications.send'])->get();
        echo "    Notification perms: " . $userPerms->count() . "\n";
    }
}

echo "\n=== END DIAGNOSTIC ===\n\n";

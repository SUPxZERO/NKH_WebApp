<?php

define('LARAVEL_START', microtime(true));
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "\n=== FINAL VERIFICATION ===\n\n";

// Check all roles that need notifications access
$requiredRoles = ['super-admin', 'admin', 'chief', 'service-manager', 'finance-manager', 'hr-manager', 'inventory-manager', 'operations-manager', 'viewer'];

echo "Checking notification permissions for all admin roles:\n";
$allHavePerms = true;

foreach ($requiredRoles as $roleSlug) {
    $role = DB::table('roles')->where('slug', $roleSlug)->first();
    if (!$role) {
        echo "  ❌ {$roleSlug}: ROLE NOT FOUND\n";
        $allHavePerms = false;
        continue;
    }

    $notifPerms = DB::table('role_permission')
        ->where('role_id', $role->id)
        ->join('permissions', 'role_permission.permission_id', '=', 'permissions.id')
        ->whereIn('permissions.slug', ['notifications.view', 'notifications.send'])
        ->count();

    if ($notifPerms >= 1) {
        echo "  ✅ {$roleSlug}: {$notifPerms} permissions\n";
    } else {
        echo "  ❌ {$roleSlug}: NO NOTIFICATION PERMISSIONS\n";
        $allHavePerms = false;
    }
}

echo "\n" . ($allHavePerms ? "✅ ALL ROLES CONFIGURED CORRECTLY" : "❌ SOME ROLES MISSING PERMISSIONS") . "\n";

// Check users
echo "\nAdmin users with access:\n";
$adminUsers = DB::table('users')
    ->join('role_user', 'users.id', '=', 'role_user.user_id')
    ->join('roles', 'role_user.role_id', '=', 'roles.id')
    ->whereIn('roles.slug', $requiredRoles)
    ->select('users.id', 'users.email', 'roles.slug as role')
    ->get();

foreach ($adminUsers as $user) {
    echo "  ✅ {$user->email} ({$user->role})\n";
}

echo "\n=== END VERIFICATION ===\n\n";

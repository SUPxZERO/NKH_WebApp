<?php

define('LARAVEL_START', microtime(true));

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;

echo "\n=== NOTIFICATION PERMISSIONS CHECK ===\n\n";

// Check permissions
$perms = DB::table('permissions')->whereIn('slug', ['notifications.view', 'notifications.send'])->get();
echo "Permissions in DB: " . $perms->count() . "\n";
foreach ($perms as $p) {
    echo "  - {$p->slug} (id: {$p->id})\n";
}

// Check admin role and its permissions
echo "\nAdmin Role:\n";
$adminRole = DB::table('roles')->where('slug', 'admin')->first();
if ($adminRole) {
    echo "  Found: {$adminRole->name}\n";
    $rolePerms = DB::table('role_permission')
        ->where('role_id', $adminRole->id)
        ->join('permissions', 'role_permission.permission_id', '=', 'permissions.id')
        ->whereIn('permissions.slug', ['notifications.view', 'notifications.send'])
        ->get();
    echo "  Has notification perms: " . $rolePerms->count() . "\n";
    foreach ($rolePerms as $p) {
        echo "    - {$p->slug}\n";
    }
} else {
    echo "  NOT FOUND\n";
}

// Check all roles
echo "\nAll Roles with permissions:\n";
$roles = DB::table('roles')->get();
foreach ($roles as $role) {
    $perms = DB::table('role_permission')->where('role_id', $role->id)->count();
    echo "  - {$role->slug}: {$perms} permissions\n";
}

// Check users and their roles
echo "\nAdmin Users:\n";
$adminUsers = DB::table('users')
    ->join('role_user', 'users.id', '=', 'role_user.user_id')
    ->join('roles', 'role_user.role_id', '=', 'roles.id')
    ->whereIn('roles.slug', ['admin', 'super-admin'])
    ->select('users.id', 'users.email', 'roles.slug as role')
    ->get();

echo "Found: " . count($adminUsers) . "\n";
foreach ($adminUsers as $user) {
    echo "  - {$user->email} ({$user->role})\n";
}

echo "\n=== END CHECK ===\n\n";

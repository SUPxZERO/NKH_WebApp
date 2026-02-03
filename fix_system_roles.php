<?php

use App\Models\Role;
use App\Models\User; // Assuming User model is needed if we need to check assignments, but relation is on Role
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Starting System Role Fix...\n";

DB::transaction(function () {
    // 1. Standardize Super Admin Slug
    $superAdminRole = Role::where('slug', 'super-admin')->first();
    $badSuperAdminRole = Role::where('slug', 'super-administrator')->first();

    if ($badSuperAdminRole) {
        if ($superAdminRole) {
            echo "Both 'super-admin' and 'super-administrator' exist. Merging...\n";
            // Move users from bad to good
            $users = $badSuperAdminRole->users;
            foreach ($users as $user) {
                if (!$user->hasRole('super-admin')) {
                    $user->assignRole($superAdminRole);
                    echo " - Assigned 'super-admin' to user {$user->id}\n";
                }
            }
            // Delete bad role
            $badSuperAdminRole->delete(); // This might fail if we have a check in the controller, but here we are using Model directly.
            // However, if we added a deleting event listener it might block. 
            // Typically delete() on model is fine unless Observer blocks it.
            echo " - Deleted 'super-administrator' role.\n";
        } else {
            echo "Renaming 'super-administrator' to 'super-admin'...\n";
            $badSuperAdminRole->slug = 'super-admin';
            $badSuperAdminRole->name = 'Super Admin';
            $badSuperAdminRole->save();
            $superAdminRole = $badSuperAdminRole;
        }
    }

    if (!$superAdminRole) {
        echo "Creating 'super-admin' role...\n";
        $superAdminRole = Role::create([
            'name' => 'Super Admin',
            'slug' => 'super-admin',
            'guard_name' => 'web',
            'is_system' => true
        ]);
    }

    // 2. Lock System Roles
    $systemRoles = [
        'super-admin',
        'admin',
        'manager',
        'service-manager',
        'chief',
        'employee',
        'customer'
    ];

    foreach ($systemRoles as $slug) {
        $role = Role::where('slug', $slug)->first();
        if ($role) {
            $role->is_system = true;
            $role->save();
            echo "Locked system role: {$slug}\n";
        } else {
            echo "WARNING: System role '{$slug}' not found.\n";
        }
    }
});

echo "System Role Fix Completed.\n";

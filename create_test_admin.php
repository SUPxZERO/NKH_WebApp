<?php
// Test script to check permission issue

use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

// Create a test admin user
$testEmail = 'test-admin-' . time() . '@nkhrestaurant.com';

$user = User::create([
    'name' => 'Test Admin User',
    'email' => $testEmail,
    'password' => Hash::make('password123'),
    'is_active' => true,
]);

// Get the admin role
$adminRole = Role::where('slug', 'admin')->first();

if (!$adminRole) {
    echo "ERROR: Admin role not found!\n";
    exit(1);
}

// Attach the admin role
$user->roles()->attach($adminRole->id);

// Refresh the user
$user = $user->fresh(['roles']);

echo "Created test admin user: $testEmail\n";
echo "User ID: {$user->id}\n";
echo "Roles: " . $user->roles->pluck('slug')->join(', ') . "\n";

// Check permissions
$testPermissions = ['employees.view', 'employees.create', 'employees.update', 'employees.delete'];
foreach ($testPermissions as $perm) {
    $has = $user->hasPermission($perm);
    echo "  - $perm: " . ($has ? 'YES' : 'NO') . "\n";
}

// Create a token
$token = $user->createToken('test-token')->plainTextToken;
echo "\nAuth Token: $token\n";
echo "Use in header: Authorization: Bearer $token\n";

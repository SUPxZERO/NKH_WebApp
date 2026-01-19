<?php

namespace Database\Seeders\Prod;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Role;
use App\Models\Location;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure we have a default location for users
        $location = Location::first();
        $locationId = $location ? $location->id : 1;

        // Roles
        $adminRole = Role::where('slug', 'admin')->first();
        $superAdminRole = Role::where('slug', 'super-admin')->first();
        $managerRole = Role::where('slug', 'manager')->first();
        
        // 1. System/Super Admins
        $admins = [
            [
                'name' => 'System Administrator',
                'email' => 'demo@admin.com',
                'phone' => '+855-12-345-678',
                'password' => Hash::make('demo123'),
                'email_verified_at' => now(),
                'is_active' => true,
                'default_location_id' => $locationId,
            ],
            [
                'name' => 'IT Support',
                'email' => 'admin@nkhrestaurant.com',
                'phone' => '+855-99-999-999',
                'password' => Hash::make('admin123'),
                'email_verified_at' => now(),
                'is_active' => true,
                'default_location_id' => $locationId,
            ]
        ];

        foreach ($admins as $adminData) {
            $admin = User::updateOrCreate(
                ['email' => $adminData['email']], 
                $adminData
            );
            
            // Assign Super Admin role if available, otherwise Admin
            $roleToAssign = $superAdminRole ?? $adminRole;
            
            if ($roleToAssign) {
                $admin->roles()->syncWithoutDetaching([$roleToAssign->id]);
            }
        }

        // 2. Core Managers (Minimal set for Prod)
        $managers = [
            [
                'name' => 'General Manager',
                'email' => 'manager@nkhrestaurant.com',
                'phone' => '+855-12-111-222',
                'password' => Hash::make('manager123'),
                'email_verified_at' => now(),
                'is_active' => true,
                'default_location_id' => $locationId,
            ]
        ];

        foreach ($managers as $managerData) {
            $manager = User::updateOrCreate(
                ['email' => $managerData['email']], 
                $managerData
            );
            if ($managerRole) {
                $manager->roles()->syncWithoutDetaching([$managerRole->id]);
            }
        }
    }
}

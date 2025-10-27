<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use Illuminate\Support\Str;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => 'Admin',
                'slug' => 'admin',
                'description' => 'Full system access with all permissions',
            ],
            [
                'name' => 'Manager',
                'slug' => 'manager', 
                'description' => 'Restaurant management access',
            ],
            [
                'name' => 'Cashier',
                'slug' => 'cashier',
                'description' => 'Handles payments and orders',
            ],
            [
                'name' => 'Waiter',
                'slug' => 'waiter',
                'description' => 'Manages orders and service',
            ],
            [
                'name' => 'Chef',
                'slug' => 'chef',
                'description' => 'Kitchen management access',
            ],
            [
                'name' => 'Employee',
                'slug' => 'employee',
                'description' => 'General employee access',
            ],
            [
                'name' => 'Customer',
                'slug' => 'customer',
                'description' => 'Regular customer access',
            ]
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['slug' => $role['slug']],
                $role
            );
        }
    }
}
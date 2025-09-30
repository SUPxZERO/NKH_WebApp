<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Role;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Get roles
        $adminRole = Role::where('slug', 'admin')->first();
        $managerRole = Role::where('slug', 'manager')->first();
        $chefRole = Role::where('slug', 'chef')->first();
        $customerRole = Role::where('slug', 'customer')->first();

        // Create admin user
        $admin = User::create([
            'name' => 'System Administrator',
            'email' => 'admin@nkhrestaurant.com',
            'phone' => '+855-12-345-678',
            'password' => Hash::make('admin123'),
            'email_verified_at' => now(),
            'is_active' => true,
            'default_location_id' => 1,
        ]);
        if ($adminRole) {
            $admin->roles()->attach($adminRole->id);
        }

        // Create managers
        $managers = [
            [
                'name' => 'Sophea Chen',
                'email' => 'sophea.chen@nkhrestaurant.com',
                'phone' => '+855-12-456-789',
                'password' => Hash::make('manager123'),
                'email_verified_at' => now(),
                'is_active' => true,
                'default_location_id' => 1,
            ],
            [
                'name' => 'Pisach Lim',
                'email' => 'pisach.lim@nkhrestaurant.com',
                'phone' => '+855-12-456-790',
                'password' => Hash::make('manager123'),
                'email_verified_at' => now(),
                'is_active' => true,
                'default_location_id' => 2,
            ],
        ];

        foreach ($managers as $managerData) {
            $manager = User::create($managerData);
            if ($managerRole) {
                $manager->roles()->attach($managerRole->id);
            }
        }

        // Create employees
        $employees = [
            [
                'name' => 'Ratha Meng',
                'email' => 'ratha.meng@nkhrestaurant.com',
                'phone' => '+855-12-567-890',
                'password' => Hash::make('employee123'),
                'email_verified_at' => now(),
                'is_active' => true,
                'default_location_id' => 1,
            ],
            [
                'name' => 'Bopha Keo',
                'email' => 'bopha.keo@nkhrestaurant.com',
                'phone' => '+855-12-567-891',
                'password' => Hash::make('employee123'),
                'email_verified_at' => now(),
                'is_active' => true,
                'default_location_id' => 2,
            ],
        ];

        foreach ($employees as $employeeData) {
            $employee = User::create($employeeData);
            if ($chefRole) {
                $employee->roles()->attach($chefRole->id);
            }
        }

        // Create customers using factory
        $customers = User::factory(20)->create([
            'password' => Hash::make('customer123'),
            'email_verified_at' => now(),
            'is_active' => true,
            'default_location_id' => 1,
        ]);

        if ($customerRole) {
            foreach ($customers as $customer) {
                $customer->roles()->attach($customerRole->id);
            }
        }
    }
}

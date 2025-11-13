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
        $employeeRole = Role::where('slug', 'employee')->first();
        $customerRole = Role::where('slug', 'customer')->first();

        // ---------------------------
        // Admins
        // ---------------------------
        $admins = [
            [
                'name' => 'System Administrator',
                'email' => 'demo@admin.com',
                'phone' => '+855-12-345-678',
                'password' => Hash::make('demo123'),
                'email_verified_at' => now(),
                'is_active' => true,
                'default_location_id' => 1,
            ],
            [
                'name' => 'Secondary Admin',
                'email' => 'admin2@nkhrestaurant.com',
                'phone' => '+855-12-987-654',
                'password' => Hash::make('admin123'),
                'email_verified_at' => now(),
                'is_active' => true,
                'default_location_id' => 2,
            ],
        ];

        foreach ($admins as $adminData) {
            $admin = User::create($adminData);
            if ($adminRole) {
                $admin->roles()->attach($adminRole->id);
            }
        }

        // ---------------------------
        // Managers
        // ---------------------------
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

        // ---------------------------
        // Employees
        // ---------------------------
        $employees = [
            ['name' => 'Ratha Meng', 'email' => 'demo@employee.com', 'location' => 1],
            ['name' => 'Maria Santos', 'email' => 'maria.santos@nkhrestaurant.com', 'location' => 2],
            ['name' => 'Bopha Keo', 'email' => 'bopha.keo@nkhrestaurant.com', 'location' => 1],
            ['name' => 'Sovannak Pich', 'email' => 'sovannak.pich@nkhrestaurant.com', 'location' => 3],
            ['name' => 'Sokha Rath', 'email' => 'sokha.rath@nkhrestaurant.com', 'location' => 1],
            ['name' => 'Dara Chea', 'email' => 'dara.chea@nkhrestaurant.com', 'location' => 2],
            ['name' => 'Sreypov Noun', 'email' => 'sreypov.noun@nkhrestaurant.com', 'location' => 1],
            ['name' => 'Kimheng Ly', 'email' => 'kimheng.ly@nkhrestaurant.com', 'location' => 2],
            ['name' => 'Pheaktra Ouk', 'email' => 'pheaktra.ouk@nkhrestaurant.com', 'location' => 3],
            ['name' => 'Veasna Chhay', 'email' => 'veasna.chhay@nkhrestaurant.com', 'location' => 4],
            ['name' => 'Bunthoeun Sao', 'email' => 'bunthoeun.sao@nkhrestaurant.com', 'location' => 1],
            ['name' => 'Chenda Ros', 'email' => 'chenda.ros@nkhrestaurant.com', 'location' => 2],
            ['name' => 'Sopheak Mao', 'email' => 'sopheak.mao@nkhrestaurant.com', 'location' => 1],
            ['name' => 'Rachana Heng', 'email' => 'rachana.heng@nkhrestaurant.com', 'location' => 2],
            ['name' => 'Sreyleak Kong', 'email' => 'sreyleak.kong@nkhrestaurant.com', 'location' => 3],
            ['name' => 'Pisey Nhem', 'email' => 'pisey.nhem@nkhrestaurant.com', 'location' => 4],
        ];

        foreach ($employees as $employeeData) {
            $employee = User::create([
                'name' => $employeeData['name'],
                'email' => $employeeData['email'],
                'phone' => '+855-' . rand(10, 99) . '-' . rand(100, 999) . '-' . rand(100, 999),
                'password' => Hash::make('demo123'),
                'email_verified_at' => now(),
                'is_active' => true,
                'default_location_id' => $employeeData['location'],
            ]);
            if ($employeeRole) {
                $employee->roles()->attach($employeeRole->id);
            }
        }

        // ---------------------------
        // Customers
        // ---------------------------
        $customers = [
            ['name' => 'Chantha Lim', 'email' => 'demo@customer.com', 'location' => 1],
            ['name' => 'David Kim', 'email' => 'david.kim@yahoo.com', 'location' => 2],
            ['name' => 'Sophea Chhun', 'email' => 'sophea.chhun@hotmail.com', 'location' => 1],
            ['name' => 'Linda Martinez', 'email' => 'linda.martinez@gmail.com', 'location' => 3],
            ['name' => 'Narong Sok', 'email' => 'narong.sok@gmail.com', 'location' => 2],
            ['name' => 'Sokny Phan', 'email' => 'sokny.phan@gmail.com', 'location' => 1],
            ['name' => 'Sothy Chan', 'email' => 'sothy.chan@gmail.com', 'location' => 3],
            ['name' => 'Nita Heng', 'email' => 'nita.heng@gmail.com', 'location' => 4],
            ['name' => 'Alex Johnson', 'email' => 'alex.johnson@gmail.com', 'location' => 2],
            ['name' => 'Vanna Oum', 'email' => 'vanna.oum@gmail.com', 'location' => 1],
        ];

        foreach ($customers as $customerData) {
            $customer = User::create([
                'name' => $customerData['name'],
                'email' => $customerData['email'],
                'phone' => '+855-' . rand(10, 99) . '-' . rand(100, 999) . '-' . rand(100, 999),
                'password' => Hash::make('demo123'),
                'email_verified_at' => now(),
                'is_active' => true,
                'default_location_id' => $customerData['location'],
            ]);
            if ($customerRole) {
                $customer->roles()->attach($customerRole->id);
            }
        }
    }
}

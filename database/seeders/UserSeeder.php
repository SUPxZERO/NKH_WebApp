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
            ['name' => 'Ratha Meng', 'email' => 'ratha.meng@nkhrestaurant.com', 'location' => 1],
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
                'password' => Hash::make('employee123'),
                'email_verified_at' => now(),
                'is_active' => true,
                'default_location_id' => $employeeData['location'],
            ]);
            $employee->roles()->attach(Role::where('slug', 'employee')->first()->id);
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

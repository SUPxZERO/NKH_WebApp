<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\Location;
use Illuminate\Support\Facades\Hash;

class DemoUsersSeeder extends Seeder
{
    /**
     * Seed demo users for easy testing and development.
     * These match the credentials shown in SignIn.tsx
     */
    public function run(): void
    {
        // Get first location for employee assignment
        $location = Location::first();

        if (!$location) {
            $this->command->warn('No locations found. Please seed locations first.');
            return;
        }

        // 1. Demo Admin User
        $adminUser = User::updateOrCreate(
            ['email' => 'demo@admin.com'],
            [
                'name' => 'Demo Admin',
                'password' => Hash::make('Demo123'),
                'email_verified_at' => now(),
                'role' => 'admin',
            ]
        );
        $this->command->info('✅ Created Demo Admin: demo@admin.com / Demo123');

        // 2. Demo Customer User
        $customerUser = User::updateOrCreate(
            ['email' => 'customer@example.com'],
            [
                'name' => 'Demo Customer',
                'password' => Hash::make('Demo123'),
                'email_verified_at' => now(),
                'role' => 'customer',
            ]
        );

        // Create customer profile
        Customer::updateOrCreate(
            ['user_id' => $customerUser->id],
            [
                'phone' => '+1234567890',
                'loyalty_points' => 100,
            ]
        );
        $this->command->info('✅ Created Demo Customer: customer@example.com / Demo123');

        // 3. Demo Employee User
        $employeeUser = User::updateOrCreate(
            ['email' => 'staff@restaurant.com'],
            [
                'name' => 'Demo Staff',
                'password' => Hash::make('Demo123'),
                'email_verified_at' => now(),
                'role' => 'employee',
            ]
        );

        // Create employee profile
        Employee::updateOrCreate(
            ['user_id' => $employeeUser->id],
            [
                'location_id' => $location->id,
                'employee_code' => 'DEMO001',
                'hourly_rate' => 15.00,
                'hire_date' => now()->subMonths(6),
                'status' => 'active',
            ]
        );
        $this->command->info('✅ Created Demo Employee: staff@restaurant.com / Demo123');

        $this->command->info('');
        $this->command->info('🎉 Demo users seeded successfully!');
        $this->command->info('');
        $this->command->line('Login Credentials:');
        $this->command->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->line('Admin:    demo@admin.com / Demo123');
        $this->command->line('Customer: customer@example.com / Demo123');
        $this->command->line('Employee: staff@restaurant.com / Demo123');
        $this->command->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
}

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
                'password' => Hash::make('demo123'),
                'email_verified_at' => now(),
                'role' => 'admin',
            ]
        );
        $this->command->info('✅ Created Demo Admin: demo@admin.com / demo123');

        // 2. Demo Customer User
        $customerUser = User::updateOrCreate(
            ['email' => 'demo@customer.com'],
            [
                'name' => 'Demo Customer',
                'password' => Hash::make('demo123'),
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
        $this->command->info('✅ Created Demo Customer: demo@customer.com / demo123');

        // 3. Demo Employee Users (Various Roles)
        $employeeRoles = [
            'employee' => ['email' => 'demo@employee.com', 'name' => 'Demo Employee', 'code' => 'DEM001'],
            'manager'  => ['email' => 'demo@manager.com', 'name' => 'Demo Manager', 'code' => 'DEM002'],
            'cashier'  => ['email' => 'demo@cashier.com', 'name' => 'Demo Cashier', 'code' => 'DEM003'],
            'waiter'   => ['email' => 'demo@waiter.com', 'name' => 'Demo Waiter', 'code' => 'DEM004'],
            'chef'     => ['email' => 'demo@chef.com', 'name' => 'Demo Chef', 'code' => 'DEM005'],
            'driver'   => ['email' => 'demo@driver.com', 'name' => 'Demo Driver', 'code' => 'DEM006'],
        ];

        foreach ($employeeRoles as $roleSlug => $data) {
            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => Hash::make('demo123'),
                    'email_verified_at' => now(),
                    'role' => $roleSlug,
                ]
            );

            // Assign via Spatie if method exists
            if (method_exists($user, 'assignRole')) {
                // Ignore error if role doesn't exist in DB
                try {
                    $user->syncRoles([$roleSlug]);
                } catch (\Exception $e) {}
            }

            // Create employee profile
            Employee::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'location_id' => $location->id,
                    'employee_code' => $data['code'],
                    'hourly_rate' => 15.00,
                    'hire_date' => now()->subMonths(6),
                    'status' => 'active',
                ]
            );
            $this->command->info("✅ Created Demo {$data['name']}: {$data['email']} / demo123");
        }

        // 4. Additional Admin / Management Roles
        $additionalAdminRoles = [
            'super-admin'        => ['email' => 'demo@superadmin.com', 'name' => 'Demo Super Admin'],
            'chief'              => ['email' => 'demo@chief.com', 'name' => 'Demo Chief'],
            'service-manager'    => ['email' => 'demo@servicemanager.com', 'name' => 'Demo Service Mgr'],
            'finance-manager'    => ['email' => 'demo@financemanager.com', 'name' => 'Demo Finance Mgr'],
            'hr-manager'         => ['email' => 'demo@hrmanager.com', 'name' => 'Demo HR Mgr'],
            'inventory-manager'  => ['email' => 'demo@inventorymanager.com', 'name' => 'Demo Inventory Mgr'],
            'operations-manager' => ['email' => 'demo@operationsmanager.com', 'name' => 'Demo Ops Mgr'],
            'viewer'             => ['email' => 'demo@viewer.com', 'name' => 'Demo Viewer'],
        ];

        foreach ($additionalAdminRoles as $roleSlug => $data) {
            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => Hash::make('demo123'),
                    'email_verified_at' => now(),
                    'role' => $roleSlug,
                ]
            );

            if (method_exists($user, 'assignRole')) {
                try {
                    $user->syncRoles([$roleSlug]);
                } catch (\Exception $e) {}
            }
            $this->command->info("✅ Created Demo {$data['name']}: {$data['email']} / demo123");
        }

        $this->command->info('');
        $this->command->info('🎉 Demo users seeded successfully!');
        $this->command->info('');
        $this->command->line('Login Credentials:');
        $this->command->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->line('Admin:    demo@admin.com / demo123');
        $this->command->line('Customer: demo@customer.com / demo123');
        foreach ($employeeRoles as $roleSlug => $data) {
            $this->command->line(str_pad(ucfirst($data['name']) . ':', 25) . " {$data['email']} / demo123");
        }
        foreach ($additionalAdminRoles as $roleSlug => $data) {
            $this->command->line(str_pad(ucfirst($data['name']) . ':', 25) . " {$data['email']} / demo123");
        }
        $this->command->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Employee;
use App\Models\User;
use App\Models\Role;
use App\Models\Position;
use App\Models\Location;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Creating employee role if it doesn\'t exist...');
        $employeeRole = Role::firstOrCreate(
            ['slug' => 'employee'],
            [
                'name' => 'Employee',
                'description' => 'General employee access'
            ]
        );

        $this->command->info('Creating or updating locations...');
        $locationData = [
            ['code' => 'NKH-DT', 'name' => 'NKH Downtown', 'address' => '123 Downtown St, Phnom Penh'],
        ];

        $locations = collect();
        foreach ($locationData as $data) {
            $location = Location::firstOrCreate(
                ['code' => $data['code']],
                [
                    'name' => $data['name'],
                    'address' => $data['address'],
                    'is_active' => true
                ]
            );
            $locations->push($location);
        }

        $this->command->info('Creating or updating positions...');
        $positionData = [
            ['name' => 'Head Chef', 'department' => 'Kitchen'],
            ['name' => 'Sous Chef', 'department' => 'Kitchen'],
            ['name' => 'Line Cook', 'department' => 'Kitchen'],
            ['name' => 'Head Waiter', 'department' => 'Service'],
            ['name' => 'Waiter', 'department' => 'Service'],
            ['name' => 'Bartender', 'department' => 'Bar'],
            ['name' => 'Cashier', 'department' => 'Front Office'],
        ];

        $positions = collect();
        foreach ($positionData as $data) {
            $position = Position::firstOrCreate(
                ['title' => $data['name']],
                [
                    'description' => "Position in {$data['department']} department",
                    'is_active' => true
                ]
            );
            $positions->push($position);
        }

        $employeeAssignments = [
            // Head Chefs
            ['name' => 'Ratha Meng', 'email' => 'ratha.meng@nkhrestaurant.com', 'position' => 'Head Chef', 'location' => 'NKH-DT', 'salary' => 2200.00, 'salary_type' => 'monthly'],
            ['name' => 'Maria Santos', 'email' => 'maria.santos@nkhrestaurant.com', 'position' => 'Head Chef', 'location' => 'NKH-DT', 'salary' => 2200.00, 'salary_type' => 'monthly'],
            
            // Sous Chefs
            ['name' => 'Bopha Keo', 'email' => 'bopha.keo@nkhrestaurant.com', 'position' => 'Sous Chef', 'location' => 'NKH-DT', 'salary' => 1600.00, 'salary_type' => 'monthly'],
            ['name' => 'Sovannak Pich', 'email' => 'sovannak.pich@nkhrestaurant.com', 'position' => 'Sous Chef', 'location' => 'NKH-DT', 'salary' => 1600.00, 'salary_type' => 'monthly'],
            
            // Head Waiters
            ['name' => 'Sokha Rath', 'email' => 'sokha.rath@nkhrestaurant.com', 'position' => 'Head Waiter', 'location' => 'NKH-DT', 'salary' => 1400.00, 'salary_type' => 'monthly'],
            ['name' => 'Dara Chea', 'email' => 'dara.chea@nkhrestaurant.com', 'position' => 'Head Waiter', 'location' => 'NKH-DT', 'salary' => 1400.00, 'salary_type' => 'monthly'],
            
            // Waiters
            ['name' => 'Sreypov Noun', 'email' => 'sreypov.noun@nkhrestaurant.com', 'position' => 'Waiter', 'location' => 'NKH-DT', 'salary' => 8.50, 'salary_type' => 'hourly'],
            ['name' => 'Kimheng Ly', 'email' => 'kimheng.ly@nkhrestaurant.com', 'position' => 'Waiter', 'location' => 'NKH-DT', 'salary' => 8.50, 'salary_type' => 'hourly'],
            ['name' => 'Pheaktra Ouk', 'email' => 'pheaktra.ouk@nkhrestaurant.com', 'position' => 'Waiter', 'location' => 'NKH-DT', 'salary' => 8.50, 'salary_type' => 'hourly'],
            ['name' => 'Veasna Chhay', 'email' => 'veasna.chhay@nkhrestaurant.com', 'position' => 'Waiter', 'location' => 'NKH-DT', 'salary' => 8.50, 'salary_type' => 'hourly'],
            
            // Line Cooks
            ['name' => 'Bunthoeun Sao', 'email' => 'bunthoeun.sao@nkhrestaurant.com', 'position' => 'Line Cook', 'location' => 'NKH-DT', 'salary' => 12.00, 'salary_type' => 'hourly'],
            ['name' => 'Chenda Ros', 'email' => 'chenda.ros@nkhrestaurant.com', 'position' => 'Line Cook', 'location' => 'NKH-DT', 'salary' => 12.00, 'salary_type' => 'hourly'],
            
            // Bartenders
            ['name' => 'Sopheak Mao', 'email' => 'sopheak.mao@nkhrestaurant.com', 'position' => 'Bartender', 'location' => 'NKH-DT', 'salary' => 10.00, 'salary_type' => 'hourly'],
            ['name' => 'Rachana Heng', 'email' => 'rachana.heng@nkhrestaurant.com', 'position' => 'Bartender', 'location' => 'NKH-DT', 'salary' => 10.00, 'salary_type' => 'hourly'],
            
            // Cashiers
            ['name' => 'Sreyleak Kong', 'email' => 'sreyleak.kong@nkhrestaurant.com', 'position' => 'Cashier', 'location' => 'NKH-DT', 'salary' => 9.00, 'salary_type' => 'hourly'],
            ['name' => 'Pisey Nhem', 'email' => 'pisey.nhem@nkhrestaurant.com', 'position' => 'Cashier', 'location' => 'NKH-DT', 'salary' => 9.00, 'salary_type' => 'hourly'],
        ];

        $this->command->info('Creating employees and their user accounts...');
        foreach ($employeeAssignments as $assignment) {
            // Create or find user
            $user = User::firstOrCreate(
                ['email' => $assignment['email']],
                [
                    'name' => $assignment['name'],
                    'password' => Hash::make('employee123'),
                    'phone' => '+855-' . rand(10, 99) . '-' . rand(100, 999) . '-' . rand(100, 999),
                    'email_verified_at' => now(),
                    'is_active' => true,
                    'default_location_id' => $locations->where('code', $assignment['location'])->first()->id
                ]
            );

            // Attach employee role if not already attached
            if (!$user->hasRole('employee')) {
                $user->roles()->attach($employeeRole->id);
            }

            // Get position and location
            $position = $positions->where('title', $assignment['position'])->first();
            $location = $locations->where('code', $assignment['location'])->first();

            // Create employee record if it doesn't exist
            Employee::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'position_id' => $position->id,
                    'location_id' => $location->id,
                    'employee_code' => $this->generateEmployeeId($location->code),
                    'hire_date' => now()->subDays(rand(30, 365)),
                    'salary' => $assignment['salary'],
                    'salary_type' => $assignment['salary_type'],
                    'status' => $this->getEmployeeStatus(),
                    'phone' => $user->phone,
                    'address' => $this->generateAddress(),
                ]
            );
        }

        $this->command->info('Employee seeding completed successfully!');
    }

    private function generateEmployeeId(string $locationCode): string
    {
        $prefix = $locationCode . '-EMP-';
        do {
            $id = $prefix . str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT);
        } while (Employee::where('employee_code', $id)->exists());
        
        return $id;
    }

    private function getEmployeeStatus(): string
    {
        $statuses = ['active', 'active', 'active', 'active', 'on_leave', 'inactive'];
        return $statuses[array_rand($statuses)];
    }

    private function generateEmergencyContact(): string
    {
        $names = [
            'Sophea Lim', 'Pisach Chen', 'Channary Sok', 'Virak Tan', 'Bopha Keo',
            'Sovannak Pich', 'Sokha Rath', 'Dara Chea', 'Sreypov Noun', 'Kimheng Ly',
            'Pheaktra Ouk', 'Veasna Chhay', 'Bunthoeun Sao', 'Chenda Ros', 'Sopheak Mao'
        ];
        
        return $names[array_rand($names)];
    }

    private function generateAddress(): string
    {
        $streets = [
            'Norodom Blvd', 'Monivong Blvd', 'Sihanouk Blvd', 'Street 271',
            'Street 310', 'Street 51', 'Mao Tse Toung Blvd', 'Russian Blvd'
        ];
        $districts = ['Chamkarmon', 'Daun Penh', 'Tuol Kork', 'Sen Sok', 'Mean Chey'];
        
        $number = rand(1, 999);
        $street = $streets[array_rand($streets)];
        $district = $districts[array_rand($districts)];
        
        return "$number $street, $district District, Phnom Penh";
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Employee;
use App\Models\User;
use App\Models\Position;
use App\Models\Location;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $employeeUsers = User::where('role', 'employee')->get();
        $positions = Position::all();
        $locations = Location::all();
        
        $employeeAssignments = [
            // Head Chefs
            'ratha.meng@nkhrestaurant.com' => ['position' => 'Head Chef', 'location' => 'NKH-DT', 'salary' => 2200.00, 'salary_type' => 'monthly'],
            'maria.santos@nkhrestaurant.com' => ['position' => 'Head Chef', 'location' => 'NKH-SR', 'salary' => 2200.00, 'salary_type' => 'monthly'],
            
            // Sous Chefs
            'bopha.keo@nkhrestaurant.com' => ['position' => 'Sous Chef', 'location' => 'NKH-DT', 'salary' => 1600.00, 'salary_type' => 'monthly'],
            'sovannak.pich@nkhrestaurant.com' => ['position' => 'Sous Chef', 'location' => 'NKH-BB', 'salary' => 1600.00, 'salary_type' => 'monthly'],
            
            // Head Waiters
            'sokha.rath@nkhrestaurant.com' => ['position' => 'Head Waiter', 'location' => 'NKH-DT', 'salary' => 1400.00, 'salary_type' => 'monthly'],
            'dara.chea@nkhrestaurant.com' => ['position' => 'Head Waiter', 'location' => 'NKH-SR', 'salary' => 1400.00, 'salary_type' => 'monthly'],
            
            // Waiters
            'sreypov.noun@nkhrestaurant.com' => ['position' => 'Waiter', 'location' => 'NKH-DT', 'salary' => 8.50, 'salary_type' => 'hourly'],
            'kimheng.ly@nkhrestaurant.com' => ['position' => 'Waiter', 'location' => 'NKH-SR', 'salary' => 8.50, 'salary_type' => 'hourly'],
            'pheaktra.ouk@nkhrestaurant.com' => ['position' => 'Waiter', 'location' => 'NKH-BB', 'salary' => 8.50, 'salary_type' => 'hourly'],
            'veasna.chhay@nkhrestaurant.com' => ['position' => 'Waiter', 'location' => 'NKH-KP', 'salary' => 8.50, 'salary_type' => 'hourly'],
            
            // Line Cooks
            'bunthoeun.sao@nkhrestaurant.com' => ['position' => 'Line Cook', 'location' => 'NKH-DT', 'salary' => 12.00, 'salary_type' => 'hourly'],
            'chenda.ros@nkhrestaurant.com' => ['position' => 'Line Cook', 'location' => 'NKH-SR', 'salary' => 12.00, 'salary_type' => 'hourly'],
            
            // Bartenders
            'sopheak.mao@nkhrestaurant.com' => ['position' => 'Bartender', 'location' => 'NKH-DT', 'salary' => 10.00, 'salary_type' => 'hourly'],
            'rachana.heng@nkhrestaurant.com' => ['position' => 'Bartender', 'location' => 'NKH-SR', 'salary' => 10.00, 'salary_type' => 'hourly'],
            
            // Cashiers
            'sreyleak.kong@nkhrestaurant.com' => ['position' => 'Cashier', 'location' => 'NKH-BB', 'salary' => 9.00, 'salary_type' => 'hourly'],
            'pisey.nhem@nkhrestaurant.com' => ['position' => 'Cashier', 'location' => 'NKH-KP', 'salary' => 9.00, 'salary_type' => 'hourly'],
        ];

        foreach ($employeeUsers as $user) {
            $assignment = $employeeAssignments[$user->email] ?? null;
            
            if ($assignment) {
                $position = $positions->where('name', $assignment['position'])->first();
                $location = $locations->where('code', $assignment['location'])->first();
                
                if ($position && $location) {
                    Employee::create([
                        'user_id' => $user->id,
                        'position_id' => $position->id,
                        'location_id' => $location->id,
                        'employee_id' => $this->generateEmployeeId($location->code),
                        'hire_date' => now()->subDays(rand(30, 365)),
                        'salary' => $assignment['salary'],
                        'salary_type' => $assignment['salary_type'],
                        'status' => $this->getEmployeeStatus(),
                        'emergency_contact_name' => $this->generateEmergencyContact(),
                        'emergency_contact_phone' => '+855-' . rand(10, 99) . '-' . rand(100, 999) . '-' . rand(100, 999),
                    ]);
                }
            }
        }
    }

    private function generateEmployeeId(string $locationCode): string
    {
        return $locationCode . '-EMP-' . str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT);
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
}

<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\Location;
use App\Models\Position;
use App\Models\User;
use Illuminate\Database\Seeder;

class EnsureAdminsHaveEmployeeRecordSeeder extends Seeder
{
    /**
     * Ensure admin users have employee records so they can access the employee dashboard.
     */
    public function run(): void
    {
        // Get admin and manager users who don't have employee records
        $users = User::whereHas('roles', function ($q) {
            $q->whereIn('slug', ['admin', 'manager', 'super-admin']);
        })->whereDoesntHave('employee')->get();

        if ($users->isEmpty()) {
            $this->command->info('All admin/manager users already have employee records.');
            return;
        }

        // Get default location and position
        $location = Location::first();
        $position = Position::first();

        if (!$location) {
            $this->command->warn('No location found. Skipping.');
            return;
        }

        foreach ($users as $user) {
            // Generate unique employee code
            $code = 'ADM-' . str_pad($user->id, 4, '0', STR_PAD_LEFT);
            
            Employee::create([
                'user_id' => $user->id,
                'employee_code' => $code,
                'position_id' => $position?->id,
                'location_id' => $location->id,
                'hire_date' => now()->subYear(),
                'salary' => 3000,
                'salary_type' => 'monthly',
                'status' => 'active',
                'address' => 'Office Location',
            ]);

            $this->command->info("Created employee record for {$user->name} ({$user->email})");
        }

        $this->command->info('Admin employee records created successfully!');
    }
}

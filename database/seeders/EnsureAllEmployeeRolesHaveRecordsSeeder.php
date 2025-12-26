<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\Location;
use App\Models\Position;
use App\Models\User;
use Illuminate\Database\Seeder;

class EnsureAllEmployeeRolesHaveRecordsSeeder extends Seeder
{
    /**
     * Ensure users with the 'employee' role have corresponding Employee records.
     */
    public function run(): void
    {
        // Get users with employee role who don't have employee records
        $users = User::whereHas('roles', function ($q) {
            $q->where('slug', 'employee');
        })->whereDoesntHave('employee')->get();

        if ($users->isEmpty()) {
            $this->command->info('All users with employee role already have employee records.');
            return;
        }

        // Get default location and position
        $location = Location::first();
        $position = Position::where('title', 'Waiter')->first() ?? Position::first();

        if (!$location) {
            $this->command->warn('No location found. Skipping.');
            return;
        }

        foreach ($users as $user) {
            // Generate unique employee code
            $code = 'EMP-' . str_pad($user->id, 4, '0', STR_PAD_LEFT);
            
            $employee = Employee::create([
                'user_id' => $user->id,
                'employee_code' => $code,
                'position_id' => $position?->id,
                'location_id' => $location->id,
                'hire_date' => now()->subMonths(6),
                'salary' => 1200,
                'salary_type' => 'monthly',
                'status' => 'active',
                'address' => 'Company Address',
            ]);

            $this->command->info("Created employee record for {$user->name} ({$user->email}) - Employee ID: {$employee->id}");
        }

        $this->command->info('Employee records created successfully!');
    }
}

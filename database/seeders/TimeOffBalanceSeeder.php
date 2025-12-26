<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\TimeOffBalance;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class TimeOffBalanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all employees
        $employees = Employee::all();
        
        if ($employees->isEmpty()) {
            $this->command->warn('No employees found. Skipping time off balance seeding.');
            return;
        }

        $currentYear = Carbon::now()->year;

        foreach ($employees as $employee) {
            // Check if balance already exists for this employee this year
            $exists = TimeOffBalance::where('employee_id', $employee->id)
                ->where('year', $currentYear)
                ->exists();
            
            if (!$exists) {
                TimeOffBalance::create([
                    'employee_id' => $employee->id,
                    'year' => $currentYear,
                    // Standard PTO hours (convert days to hours, 8 hours per day)
                    'vacation_hours_available' => rand(80, 160), // 10-20 days
                    'vacation_hours_used' => rand(0, 40), // 0-5 days used
                    'sick_hours_available' => rand(40, 80), // 5-10 days
                    'sick_hours_used' => rand(0, 16), // 0-2 days used
                    'personal_hours_available' => rand(24, 40), // 3-5 days
                    'personal_hours_used' => rand(0, 8), // 0-1 day used
                ]);
            }
        }

        $this->command->info('Time off balances seeded successfully!');
    }
}

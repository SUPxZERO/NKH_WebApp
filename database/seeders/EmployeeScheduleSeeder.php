<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class EmployeeScheduleSeeder extends Seeder
{
    /**
     * Seed sample shifts and time off requests for testing
     */
    public function run(): void
    {
        // Get first employee
        $employee = DB::table('employees')->first();
        
        if (!$employee) {
            $this->command->warn('No employees found. Create employees first.');
            return;
        }

        $position = DB::table('positions')->first();
        $location = DB::table('locations')->first();

        if (!$position || !$location) {
            $this->command->warn('No positions or locations found.');
            return;
        }

        $this->command->info('Creating sample shifts for employee: ' . $employee->id);

        // Clear existing test data for this employee
        DB::table('shifts')->where('employee_id', $employee->id)->delete();
        DB::table('time_off_requests')->where('employee_id', $employee->id)->delete();

        // Create shifts for next 2 weeks
        $shifts = [];
        $today = Carbon::today();

        for ($i = 0; $i < 14; $i++) {
            $date = $today->copy()->addDays($i);
            
            // Skip Sundays
            if ($date->dayOfWeek === 0) {
                continue;
            }

            // Monday, Wednesday, Friday: Morning shift
            if (in_array($date->dayOfWeek, [1, 3, 5])) {
                $shifts[] = [
                    'employee_id' => $employee->id,
                    'position_id' => $position->id,
                    'location_id' => $location->id,
                    'date' => $date->toDateString(),
                    'start_time' => '09:00:00',
                    'end_time' => '17:00:00',
                    'status' => 'scheduled',
                    'notes' => 'Morning shift - Server',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            // Tuesday, Thursday, Saturday: Evening shift
            if (in_array($date->dayOfWeek, [2, 4, 6])) {
                $shifts[] = [
                    'employee_id' => $employee->id,
                    'position_id' => $position->id,
                    'location_id' => $location->id,
                    'date' => $date->toDateString(),
                    'start_time' => '14:00:00',
                    'end_time' => '22:00:00',
                    'status' => 'scheduled',
                    'notes' => 'Evening shift - Server',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        DB::table('shifts')->insert($shifts);
        $this->command->info('Created ' . count($shifts) . ' shifts');

        // Create sample time off requests
        DB::table('time_off_requests')->insert([
            'employee_id' => $employee->id,
            'start_date' => $today->copy()->addDays(20)->toDateString(),
            'end_date' => $today->copy()->addDays(22)->toDateString(),
            'reason' => 'Family vacation',
            'status' => 'pending',
            'created_at' => now()->subDays(2),
            'updated_at' => now()->subDays(2),
        ]);

        DB::table('time_off_requests')->insert([
            'employee_id' => $employee->id,
            'start_date' => $today->copy()->addDays(30)->toDateString(),
            'end_date' => $today->copy()->addDays(30)->toDateString(),
            'reason' => 'Doctor appointment',
            'status' => 'approved',
            'approved_by' => 1, // Assuming admin user ID 1
            'approved_at' => now()->subDay(),
            'admin_notes' => 'Approved - enjoy your time off',
            'created_at' => now()->subDays(3),
            'updated_at' => now()->subDay(),
        ]);

        $this->command->info('Created 2 time off requests');

        $this->command->info('✅ Employee schedule seeder completed!');
    }
}

<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class DecemberAttendanceSeeder extends Seeder
{
    public function run()
    {
        $employees = Employee::all();
        $startDate = Carbon::create(2025, 12, 1);
        $endDate = Carbon::create(2025, 12, 18);

        foreach ($employees as $employee) {
            $currentDate = $startDate->copy();
            
            while ($currentDate->lte($endDate)) {
                // Skip weekends
                if ($currentDate->isWeekend()) {
                    $currentDate->addDay();
                    continue;
                }

                // Check if attendance already exists
                $exists = Attendance::where('employee_id', $employee->id)
                    ->whereDate('clock_in_at', $currentDate->format('Y-m-d'))
                    ->exists();
                
                if ($exists) {
                    $currentDate->addDay();
                    continue;
                }

                // Randomize times: 8:00 AM +/- 15 mins, 5:00 PM +/- 30 mins
                $clockIn = $currentDate->copy()->setTime(8, 0, 0)->addMinutes(rand(-15, 15));
                $clockOut = $currentDate->copy()->setTime(17, 0, 0)->addMinutes(rand(-30, 30));

                $location = \App\Models\Location::first();
                Attendance::create([
                    'employee_id' => $employee->id,
                    'location_id' => $location ? $location->id : 1, // Fallback to 1 if no location
                    'clock_in_at' => $clockIn,
                    'clock_out_at' => $clockOut,
                    'notes' => 'Seeded data',
                ]);

                $currentDate->addDay();
            }
        }
    }
}

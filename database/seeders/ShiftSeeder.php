<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\Location;
use App\Models\Position;
use App\Models\Shift;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ShiftSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all employees
        $employees = Employee::all();
        
        if ($employees->isEmpty()) {
            $this->command->warn('No employees found. Skipping shift seeding.');
            return;
        }

        // Get locations and positions
        $locations = Location::all();
        $positions = Position::all();

        if ($locations->isEmpty()) {
            $this->command->warn('No locations found. Creating default location.');
            $location = Location::create([
                'name' => 'Main Restaurant',
                'address' => '123 Main St',
                'city' => 'Bangkok',
                'phone' => '021234567',
                'is_active' => true,
            ]);
            $locations = collect([$location]);
        }

        $today = Carbon::today();
        
        // Shift types for variety
        $shiftTypes = ['morning', 'afternoon', 'evening', 'night'];
        
        // Create shifts for each employee for the next 14 days
        foreach ($employees as $employee) {
            $location = $locations->random();
            $position = $positions->isNotEmpty() ? $positions->random() : null;
            
            // Create shifts for past 30 days and future 14 days
            $shiftDays = collect(range(-30, 13))->random(rand(20, 25));
            
            foreach ($shiftDays as $dayOffset) {
                $date = $today->copy()->addDays($dayOffset);
                
                // Skip some weekends randomly
                if ($date->isWeekend() && rand(0, 1) === 0) {
                    continue;
                }
                
                // Determine shift time based on shift type
                $shiftType = $shiftTypes[array_rand($shiftTypes)];
                
                switch ($shiftType) {
                    case 'morning':
                        $startTime = '06:00:00';
                        $endTime = '14:00:00';
                        break;
                    case 'afternoon':
                        $startTime = '10:00:00';
                        $endTime = '18:00:00';
                        break;
                    case 'evening':
                        $startTime = '14:00:00';
                        $endTime = '22:00:00';
                        break;
                    case 'night':
                        $startTime = '18:00:00';
                        $endTime = '02:00:00';
                        break;
                    default:
                        $startTime = '09:00:00';
                        $endTime = '17:00:00';
                }
                
                // Check if shift already exists for this employee on this date
                $exists = Shift::where('employee_id', $employee->id)
                    ->where('date', $date->format('Y-m-d'))
                    ->exists();
                
                if (!$exists) {
                    Shift::create([
                        'employee_id' => $employee->id,
                        'position_id' => $position?->id,
                        'location_id' => $location->id,
                        'date' => $date->format('Y-m-d'),
                        'start_time' => $startTime,
                        'end_time' => $endTime,
                        'shift_type' => $shiftType,
                        'status' => 'scheduled',
                        'notes' => null,
                        'published_at' => now(),
                    ]);
                }
            }
        }

        $this->command->info('Shifts seeded successfully!');
    }
}

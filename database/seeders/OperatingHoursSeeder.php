<?php

namespace Database\Seeders;

use App\Models\Location;
use App\Models\OperatingHour;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;

class OperatingHoursSeeder extends Seeder
{
    public function run(): void
    {
        // Seed hours for all active locations
        $locations = Location::where('is_active', true)->get();

        foreach ($locations as $location) {
            $serviceTypes = ['dine-in'];
            if ($location->accepts_pickup) {
                $serviceTypes[] = 'pickup';
            }
            if ($location->accepts_delivery) {
                $serviceTypes[] = 'delivery';
            }

            foreach (range(0, 6) as $day) { // 0 (Sun) .. 6 (Sat)
                $isWeekend = in_array($day, [5, 6, 0]); // Fri, Sat, Sun

                foreach ($serviceTypes as $type) {
                    [$open, $close] = match ($type) {
                        'pickup' => $isWeekend ? ['09:00:00', '21:30:00'] : ['09:30:00', '20:30:00'],
                        'delivery' => $isWeekend ? ['09:30:00', '21:00:00'] : ['10:00:00', '20:00:00'],
                        default => $isWeekend ? ['08:30:00', '22:00:00'] : ['09:00:00', '21:00:00'],
                    };

                    OperatingHour::updateOrCreate(
                        [
                            'location_id' => $location->id,
                            'day_of_week' => $day,
                            'service_type' => $type,
                        ],
                        [
                            'opening_time' => $open,
                            'closing_time' => $close,
                        ]
                    );
                }
            }
        }

        Log::info('Operating hours seeded for locations.');
    }
}

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
        // Ensure at least one location exists for development/testing
        if (Location::count() === 0) {
            Location::create([
                'code' => 'MAIN',
                'name' => 'Main Branch',
                'address_line1' => '123 Main St',
                'city' => 'Phnom Penh',
                'state' => 'Phnom Penh',
                'postal_code' => '12000',
                'country' => 'Cambodia',
                'phone' => '+855 12 345 678',
                'is_active' => true,
                'accepts_online_orders' => true,
                'accepts_pickup' => true,
                'accepts_delivery' => true,
            ]);
        }

        $locations = Location::all();

        foreach ($locations as $location) {
            $serviceTypes = ['dine-in'];
            if ($location->accepts_pickup) {
                $serviceTypes[] = 'pickup';
            }
            if ($location->accepts_delivery) {
                $serviceTypes[] = 'delivery';
            }

            foreach (range(0, 6) as $day) { // 0 (Sun) .. 6 (Sat)
                foreach ($serviceTypes as $type) {
                    [$open, $close] = match ($type) {
                        'pickup' => ['09:30:00', '20:30:00'],
                        'delivery' => ['10:00:00', '20:00:00'],
                        default => ['09:00:00', '21:00:00'],
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

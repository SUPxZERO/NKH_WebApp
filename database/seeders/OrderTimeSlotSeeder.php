<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\OrderTimeSlot;
use Carbon\Carbon;

class OrderTimeSlotSeeder extends Seeder
{
    public function run(): void
    {
        $locations = \App\Models\Location::where('is_active', true)->get();
        $startDate = Carbon::now();
        $days = 14;

        foreach ($locations as $location) {
            $types = [];
            if ($location->accepts_pickup)
                $types[] = 'pickup';
            if ($location->accepts_delivery)
                $types[] = 'delivery';

            if (empty($types))
                continue;

            for ($d = 0; $d < $days; $d++) {
                $date = $startDate->copy()->addDays($d)->format('Y-m-d');

                foreach ($types as $type) {
                    // Slots from 8 AM to 10 PM (22:00)
                    for ($h = 8; $h < 22; $h++) {
                        // Create 30-minute intervals if needed, but for now hourly is fine
                        // Actually, let's do hourly to match previous logic but extended range
                        $time = sprintf('%02d:00:00', $h);

                        OrderTimeSlot::updateOrCreate(
                            [
                                'location_id' => $location->id,
                                'slot_date' => $date,
                                'slot_start_time' => $time,
                                'slot_type' => $type,
                            ],
                            [
                                'max_orders' => 10, // Increased capacity for testing
                                'current_orders' => 0,
                            ]
                        );
                    }
                }
            }
        }
    }
}

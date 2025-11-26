<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\OrderTimeSlot;
use Carbon\Carbon;

class OrderTimeSlotSeeder extends Seeder
{
    public function run(): void
    {
        $locationId = 1;
        $dates = [
            Carbon::now()->format('Y-m-d'),
            Carbon::now()->addDay()->format('Y-m-d'),
            Carbon::now()->addDays(2)->format('Y-m-d'),
        ];
        $types = ['pickup', 'delivery'];

        foreach ($dates as $date) {
            foreach ($types as $type) {
                // Slots from 10 AM to 8 PM
                for ($h = 10; $h < 20; $h++) {
                    $time = sprintf('%02d:00:00', $h);
                    
                    // Check if exists
                    $exists = OrderTimeSlot::where('location_id', $locationId)
                        ->where('slot_date', $date)
                        ->where('slot_start_time', $time)
                        ->where('slot_type', $type)
                        ->exists();

                    if (!$exists) {
                        OrderTimeSlot::create([
                            'location_id' => $locationId,
                            'slot_date' => $date,
                            'slot_start_time' => $time,
                            'slot_type' => $type,
                            'max_orders' => 5,
                            'current_orders' => 0,
                        ]);
                    }
                }
            }
        }
    }
}

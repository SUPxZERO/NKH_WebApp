<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\OrderTimeSlot;
use App\Models\Location;
use Carbon\Carbon;

class OrderTimeSlotSeeder extends Seeder
{
    public function run(): void
    {
        $locations = Location::all();
        
        foreach ($locations as $location) {
            // Create time slots for the next 7 days
            for ($i = 0; $i < 7; $i++) {
                $date = Carbon::now()->addDays($i)->format('Y-m-d');
                
                // Delivery time slots (11:00 AM - 9:00 PM)
                $deliverySlots = [
                    '11:00:00', '11:30:00', '12:00:00', '12:30:00', 
                    '13:00:00', '13:30:00', '17:00:00', '17:30:00',
                    '18:00:00', '18:30:00', '19:00:00', '19:30:00',
                    '20:00:00', '20:30:00'
                ];
                
                foreach ($deliverySlots as $slot) {
                    OrderTimeSlot::create([
                        'location_id' => $location->id,
                        'slot_date' => $date,
                        'slot_type' => 'delivery',
                        'slot_start_time' => $slot,
                        'max_orders' => 10,
                        'current_orders' => 0,
                    ]);
                }
            
                // Pickup time slots (10:00 AM - 10:00 PM)
                $pickupSlots = [
                    '10:00:00', '10:30:00', '11:00:00', '11:30:00',
                    '12:00:00', '12:30:00', '13:00:00', '13:30:00',
                    '14:00:00', '14:30:00', '17:00:00', '17:30:00',
                    '18:00:00', '18:30:00', '19:00:00', '19:30:00',
                    '20:00:00', '20:30:00', '21:00:00', '21:30:00'
                ];
                
                foreach ($pickupSlots as $slot) {
                    OrderTimeSlot::create([
                        'location_id' => $location->id,
                        'slot_date' => $date,
                        'slot_type' => 'pickup',
                        'slot_start_time' => $slot,
                        'max_orders' => 15,
                        'current_orders' => 0,
                    ]);
                }
            }
        }
    }
}

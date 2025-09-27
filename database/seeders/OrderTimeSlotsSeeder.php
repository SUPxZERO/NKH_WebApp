<?php

namespace Database\Seeders;

use App\Models\Location;
use App\Models\OperatingHour;
use App\Models\OrderTimeSlot;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class OrderTimeSlotsSeeder extends Seeder
{
    /**
     * Seed default time slot capacity windows per location for pickup and delivery.
     * - Generates 30-minute slots for the next 7 days, based on operating_hours.
     * - If operating_hours are missing for a service type, uses fallback windows.
     */
    public function run(): void
    {
        $locations = Location::where('accepts_online_orders', true)->get();
        if ($locations->isEmpty()) {
            return;
        }

        $startDate = Carbon::today();
        $endDate = $startDate->copy()->addDays(7); // next 7 days

        foreach ($locations as $location) {
            $serviceTypes = [];
            if ($location->accepts_pickup) {
                $serviceTypes[] = 'pickup';
            }
            if ($location->accepts_delivery) {
                $serviceTypes[] = 'delivery';
            }
            if (empty($serviceTypes)) {
                continue;
            }

            $date = $startDate->copy();
            while ($date->lessThan($endDate)) {
                $dow = (int) $date->dayOfWeek; // 0..6

                foreach ($serviceTypes as $type) {
                    $hours = OperatingHour::where('location_id', $location->id)
                        ->where('day_of_week', $dow)
                        ->where('service_type', $type)
                        ->first();

                    // Fallback windows if operating hours not present
                    [$open, $close] = match ($type) {
                        'pickup' => ['09:30:00', '20:30:00'],
                        'delivery' => ['10:00:00', '20:00:00'],
                        default => ['09:00:00', '21:00:00'],
                    };

                    $openTime = $hours ? $hours->opening_time : $open;
                    $closeTime = $hours ? $hours->closing_time : $close;

                    // Generate 30-minute slots within window
                    $slot = Carbon::parse($date->toDateString() . ' ' . $openTime);
                    $end = Carbon::parse($date->toDateString() . ' ' . $closeTime);

                    $defaultMax = $type === 'pickup' ? 20 : 12; // capacity defaults

                    while ($slot->lt($end)) {
                        OrderTimeSlot::updateOrCreate(
                            [
                                'location_id' => $location->id,
                                'slot_date' => $slot->toDateString(),
                                'slot_start_time' => $slot->format('H:i:s'),
                                'slot_type' => $type,
                            ],
                            [
                                'max_orders' => $defaultMax,
                                // Intentionally omit current_orders to avoid overwriting existing counts
                            ]
                        );

                        $slot->addMinutes(30);
                    }
                }

                $date->addDay();
            }
        }
    }
}

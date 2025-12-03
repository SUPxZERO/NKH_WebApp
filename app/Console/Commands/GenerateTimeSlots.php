<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Location;
use App\Models\OperatingHours;
use App\Models\OrderTimeSlot;
use Carbon\Carbon;

class GenerateTimeSlots extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'timeslots:generate {days=7}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate time slots for the next N days based on operating hours';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = (int) $this->argument('days');
        $this->info("Generating time slots for the next {$days} days...");

        $locations = Location::all();
        
        if ($locations->isEmpty()) {
            $this->error('No locations found. Please create locations first.');
            return 1;
        }

        $totalGenerated = 0;
        $totalSkipped = 0;

        foreach ($locations as $location) {
            $this->info("Processing location: {$location->name} (ID: {$location->id})");

            for ($i = 0; $i < $days; $i++) {
                $date = Carbon::today()->addDays($i);
                $dayOfWeek = $date->dayOfWeek; // 0 (Sunday) to 6 (Saturday)

                // Get operating hours for this day and location
                $operatingHours = OperatingHours::where('location_id', $location->id)
                    ->where('day_of_week', $dayOfWeek)
                    ->get();

                if ($operatingHours->isEmpty()) {
                    $this->warn("  No operating hours for {$date->format('Y-m-d')} ({$date->dayName})");
                    continue;
                }

                foreach ($operatingHours as $hours) {
                    $generated = $this->generateSlotsForPeriod(
                        $location->id,
                        $date,
                        $hours->opening_time,
                        $hours->closing_time,
                        $hours->service_type
                    );

                    $totalGenerated += $generated['new'];
                    $totalSkipped += $generated['existing'];
                }
            }
        }

        $this->newLine();
        $this->info("✅ Time slot generation complete!");
        $this->info("   Generated: {$totalGenerated} new slots");
        $this->info("   Skipped: {$totalSkipped} existing slots");

        return 0;
    }

    /**
     * Generate time slots for a specific period
     */
    private function generateSlotsForPeriod(
        int $locationId,
        Carbon $date,
        string $openingTime,
        string $closingTime,
        string $serviceType
    ): array {
        $new = 0;
        $existing = 0;

        // Parse times
        $start = Carbon::createFromFormat('H:i:s', $openingTime);
        $end = Carbon::createFromFormat('H:i:s', $closingTime);

        // Normalize service type
        $normalizedType = str_replace('-', '_', $serviceType);

        // Determine slot interval based on service type
        $interval = 30; // default
        if (in_array($normalizedType, ['delivery', 'dine_in'])) {
            $interval = 60;
        } elseif ($normalizedType === 'pickup') {
            $interval = 30;
        }

        // Determine max orders per slot based on service type
        $maxOrders = 10; // default
        if ($normalizedType === 'delivery') {
            $maxOrders = 5;
        } elseif ($normalizedType === 'dine_in') {
            $maxOrders = 15;
        } elseif ($normalizedType === 'pickup') {
            $maxOrders = 10;
        }

        $current = $start->copy();

        while ($current->lt($end)) {
            $slotTime = $current->format('H:i:s');

            // Check if slot already exists
            $exists = OrderTimeSlot::where('location_id', $locationId)
                ->where('slot_date', $date->format('Y-m-d'))
                ->where('slot_start_time', $slotTime)
                ->where('slot_type', $normalizedType)
                ->exists();

            if ($exists) {
                $existing++;
            } else {
                try {
                    OrderTimeSlot::create([
                        'location_id' => $locationId,
                        'slot_date' => $date->format('Y-m-d'),
                        'slot_start_time' => $slotTime,
                        'slot_type' => $normalizedType,
                        'max_orders' => $maxOrders,
                        'current_orders' => 0,
                    ]);
                    $new++;
                } catch (\Exception $e) {
                    $this->error("  Error creating slot: " . $e->getMessage());
                }
            }

            $current->addMinutes($interval);
        }

        return ['new' => $new, 'existing' => $existing];
    }
}

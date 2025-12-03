<?php

namespace App\Observers;

use App\Models\OperatingHours;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class OperatingHoursObserver
{
    /**
     * Handle the OperatingHours "created" event.
     */
    public function created(OperatingHours $operatingHours): void
    {
        $this->regenerateTimeSlots($operatingHours, 'created');
    }

    /**
     * Handle the OperatingHours "updated" event.
     */
    public function updated(OperatingHours $operatingHours): void
    {
        $this->regenerateTimeSlots($operatingHours, 'updated');
    }

    /**
     * Handle the OperatingHours "deleted" event.
     */
    public function deleted(OperatingHours $operatingHours): void
    {
        // When operating hours are deleted, remove related future time slots
        $this->deleteFutureTimeSlots($operatingHours);
    }

    /**
     * Regenerate time slots when operating hours change
     */
    private function regenerateTimeSlots(OperatingHours $operatingHours, string $action): void
    {
        try {
            Log::info("Operating hours {$action}, regenerating time slots", [
                'location_id' => $operatingHours->location_id,
                'day_of_week' => $operatingHours->day_of_week,
                'service_type' => $operatingHours->service_type,
            ]);

            // Run the time slots generation command asynchronously
            Artisan::queue('timeslots:generate', ['days' => 14]);

        } catch (\Exception $e) {
            Log::error("Failed to regenerate time slots: " . $e->getMessage());
        }
    }

    /**
     * Delete future time slots for deleted operating hours
     */
    private function deleteFutureTimeSlots(OperatingHours $operatingHours): void
    {
        try {
            $deleted = \App\Models\OrderTimeSlot::where('location_id', $operatingHours->location_id)
                ->where('slot_date', '>=', today())
                ->where('slot_type', $operatingHours->service_type)
                ->whereRaw('DAYOFWEEK(slot_date) - 1 = ?', [$operatingHours->day_of_week])
                ->delete();

            Log::info("Deleted {$deleted} future time slots for removed operating hours");
        } catch (\Exception $e) {
            Log::error("Failed to delete time slots: " . $e->getMessage());
        }
    }
}

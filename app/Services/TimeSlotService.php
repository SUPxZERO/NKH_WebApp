<?php

namespace App\Services;

use App\Models\OperatingHours;
use App\Models\OrderTimeSlot;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class TimeSlotService
{
    /**
     * Get available time slots for a given date, location, and service type
     * 
     * This generates slots dynamically from operating hours and filters out:
     * - Past time slots (for today)
     * - Fully booked slots
     * - Slots outside business hours
     * 
     * @param int $locationId
     * @param string $serviceType 'pickup' or 'delivery'
     * @param string|null $date Date in Y-m-d format (defaults to today)
     * @param int $intervalMinutes Slot interval in minutes (default 30)
     * @return Collection
     */
    public function getAvailableTimeSlots(
        int $locationId,
        string $serviceType,
        ?string $date = null,
        int $intervalMinutes = 30
    ): Collection {
        // Default to today if no date provided
        $targetDate = $date ? Carbon::parse($date) : Carbon::today();
        $dayOfWeek = $targetDate->dayOfWeek; // 0 (Sunday) to 6 (Saturday)
        $isToday = $targetDate->isToday();
        
        // Normalize service type to match database format (dine-in, pickup, delivery)
        $normalizedServiceType = $this->normalizeServiceType($serviceType);
        
        // Get operating hours for this location, day, and service type
        $operatingHours = OperatingHours::where('location_id', $locationId)
            ->where('day_of_week', $dayOfWeek)
            ->where('service_type', $normalizedServiceType)
            ->first();
            
        // If no operating hours found, return empty collection
        if (!$operatingHours) {
            Log::info("No operating hours found", [
                'location_id' => $locationId,
                'day_of_week' => $dayOfWeek,
                'service_type' => $normalizedServiceType
            ]);
            return collect([]);
        }
        
        // Generate time slots from operating hours
        $slots = $this->generateSlots(
            $targetDate,
            $operatingHours->opening_time,
            $operatingHours->closing_time,
            $intervalMinutes,
            $isToday
        );
        
        // Filter out fully booked slots by checking OrderTimeSlot table
        $slots = $this->filterBookedSlots($slots, $locationId, $targetDate, $serviceType);
        
        return $slots;
    }
    
    /**
     * Generate time slots between opening and closing time
     * 
     * @param Carbon $date
     * @param string $openingTime H:i:s format
     * @param string $closingTime H:i:s format
     * @param int $intervalMinutes
     * @param bool $isToday
     * @return Collection
     */
    private function generateSlots(
        Carbon $date,
        string $openingTime,
        string $closingTime,
        int $intervalMinutes,
        bool $isToday
    ): Collection {
        $slots = collect([]);
        
        // Parse opening and closing times
        $openTime = Carbon::parse($openingTime);
        $closeTime = Carbon::parse($closingTime);
        
        // Handle overnight hours (e.g., 6 PM - 2 AM)
        $isOvernight = $closeTime->lessThan($openTime);
        
        // Create datetime objects for the target date
        $slotTime = Carbon::parse($date->format('Y-m-d') . ' ' . $openingTime);
        $endTime = Carbon::parse($date->format('Y-m-d') . ' ' . $closingTime);
        
        // If overnight, add one day to end time
        if ($isOvernight) {
            $endTime->addDay();
        }
        
        // If today, ensure we don't show past slots
        $now = Carbon::now();
        $minimumTime = $isToday ? $now->copy()->addMinutes(30) : null; // 30 min buffer
        
        while ($slotTime->lessThan($endTime)) {
            // Skip past time slots if today
            if ($minimumTime && $slotTime->lessThan($minimumTime)) {
                $slotTime->addMinutes($intervalMinutes);
                continue;
            }
            
            $slots->push([
                'slot_date' => $date->format('Y-m-d'),
                'slot_time' => $slotTime->format('H:i:s'),
                'slot_datetime' => $slotTime->copy(),
                'label' => $slotTime->format('g:i A'),
                'full_label' => $date->format('M j, Y') . ' at ' . $slotTime->format('g:i A'),
                'is_available' => true, // Will be updated by filterBookedSlots
            ]);
            
            $slotTime->addMinutes($intervalMinutes);
        }
        
        return $slots;
    }
    
    /**
     * Filter out fully booked slots
     * 
     * @param Collection $slots
     * @param int $locationId
     * @param Carbon $date
     * @param string $serviceType
     * @return Collection
     */
    private function filterBookedSlots(
        Collection $slots,
        int $locationId,
        Carbon $date,
        string $serviceType
    ): Collection {
        // Get existing time slot bookings
        $bookedSlots = OrderTimeSlot::where('location_id', $locationId)
            ->where('slot_date', $date->format('Y-m-d'))
            ->where('slot_type', $serviceType)
            ->whereColumn('current_orders', '>=', 'max_orders') // Fully booked
            ->pluck('slot_start_time')
            ->toArray();
            
        // Filter out fully booked slots
        return $slots->filter(function ($slot) use ($bookedSlots) {
            return !in_array($slot['slot_time'], $bookedSlots);
        });
    }
    
    /**
     * Normalize service type to match database format
     * 
     * @param string $serviceType
     * @return string
     */
    private function normalizeServiceType(string $serviceType): string
    {
        $map = [
            'pickup' => 'pickup',
            'delivery' => 'delivery',
            'dine-in' => 'dine-in',
            'dine_in' => 'dine-in',
            'dinein' => 'dine-in',
        ];
        
        return $map[strtolower($serviceType)] ?? $serviceType;
    }
    
    /**
     * Get or create a time slot for booking
     * This is used when a customer places an order
     * 
     * @param int $locationId
     * @param string $date
     * @param string $time
     * @param string $serviceType
     * @param int $maxOrders
     * @return OrderTimeSlot
     */
    public function getOrCreateTimeSlot(
        int $locationId,
        string $date,
        string $time,
        string $serviceType,
        int $maxOrders = 10
    ): OrderTimeSlot {
        return OrderTimeSlot::firstOrCreate(
            [
                'location_id' => $locationId,
                'slot_date' => $date,
                'slot_start_time' => $time,
                'slot_type' => $serviceType,
            ],
            [
                'max_orders' => $maxOrders,
                'current_orders' => 0,
            ]
        );
    }
    
    /**
     * Validate if a time slot is still available for booking
     * 
     * @param int $locationId
     * @param string $date
     * @param string $time
     * @param string $serviceType
     * @return array ['valid' => bool, 'message' => string]
     */
    public function validateTimeSlot(
        int $locationId,
        string $date,
        string $time,
        string $serviceType
    ): array {
        // Check if the slot is in the past
        $slotDateTime = Carbon::parse($date . ' ' . $time);
        if ($slotDateTime->isPast()) {
            return [
                'valid' => false,
                'message' => 'This time slot has already passed. Please select a future time.'
            ];
        }
        
        // Normalize service type
        $normalizedServiceType = $this->normalizeServiceType($serviceType);
        
        // Check if location is open at this time
        $dayOfWeek = $slotDateTime->dayOfWeek;
        $operatingHours = OperatingHours::where('location_id', $locationId)
            ->where('day_of_week', $dayOfWeek)
            ->where('service_type', $normalizedServiceType)
            ->first();
            
        if (!$operatingHours) {
            return [
                'valid' => false,
                'message' => 'The restaurant is closed for ' . $serviceType . ' on this day.'
            ];
        }
        
        // Check if time is within operating hours
        $openTime = Carbon::parse($operatingHours->opening_time);
        $closeTime = Carbon::parse($operatingHours->closing_time);
        $slotTimeOnly = Carbon::parse($time);
        
        // Handle overnight hours
        if ($closeTime->lessThan($openTime)) {
            // Overnight case
            $isValid = $slotTimeOnly->greaterThanOrEqualTo($openTime) || 
                      $slotTimeOnly->lessThan($closeTime);
        } else {
            // Normal case
            $isValid = $slotTimeOnly->greaterThanOrEqualTo($openTime) && 
                      $slotTimeOnly->lessThan($closeTime);
        }
        
        if (!$isValid) {
            return [
                'valid' => false,
                'message' => 'This time is outside of operating hours (' . 
                            $openTime->format('g:i A') . ' - ' . 
                            $closeTime->format('g:i A') . ').'
            ];
        }
        
        // Check if slot is fully booked
        $timeSlot = OrderTimeSlot::where('location_id', $locationId)
            ->where('slot_date', $date)
            ->where('slot_start_time', $time)
            ->where('slot_type', $serviceType)
            ->first();
            
        if ($timeSlot && $timeSlot->current_orders >= $timeSlot->max_orders) {
            return [
                'valid' => false,
                'message' => 'This time slot is fully booked. Please select another time.'
            ];
        }
        
        return [
            'valid' => true,
            'message' => 'Time slot is available.'
        ];
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderTimeSlot;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;
use Carbon\Carbon;

class TimeSlotController extends Controller
{
    /**
     * Get available time slots for a specific date and location
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'location_id' => 'nullable|integer|exists:locations,id',
            'date' => 'nullable|date',
            'service_type' => 'nullable|in:pickup,delivery,dine_in',
        ]);

        $query = OrderTimeSlot::query();

        if (isset($validated['location_id'])) {
            $query->where('location_id', $validated['location_id']);
        }

        if (isset($validated['date'])) {
            $query->where('slot_date', $validated['date']);
        } else {
            // Default to upcoming slots
            $query->where('slot_date', '>=', today());
        }

        if (isset($validated['service_type'])) {
            $query->where('slot_type', $validated['service_type']);
        }

        $slots = $query->orderBy('slot_date')
            ->orderBy('slot_start_time')
            ->get()
            ->map(function ($slot) {
                return [
                    'id' => $slot->id,
                    'location_id' => $slot->location_id,
                    'date' => $slot->slot_date,
                    'time' => Carbon::createFromFormat('H:i:s', $slot->slot_start_time)->format('H:i'),
                    'display_time' => Carbon::createFromFormat('H:i:s', $slot->slot_start_time)->format('g:i A'),
                    'type' => $slot->slot_type,
                    'max_orders' => $slot->max_orders,
                    'current_orders' => $slot->current_orders,
                    'available' => $slot->current_orders < $slot->max_orders,
                    'availability_percentage' => $slot->max_orders > 0 
                        ? round((($slot->max_orders - $slot->current_orders) / $slot->max_orders) * 100) 
                        : 0,
                ];
            });

        return response()->json([
            'data' => $slots,
            'total' => $slots->count(),
        ]);
    }

    /**
     * Manually regenerate time slots
     */
    public function regenerate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'days' => 'nullable|integer|min:1|max:90',
            'clear_existing' => 'nullable|boolean',
        ]);

        $days = $validated['days'] ?? 14;
        $clearExisting = $validated['clear_existing'] ?? false;

        try {
            if ($clearExisting) {
                // Delete future time slots
                $deleted = OrderTimeSlot::where('slot_date', '>=', today())->delete();
            }

            // Run the generation command
            Artisan::call('timeslots:generate', ['days' => $days]);
            $output = Artisan::output();

            return response()->json([
                'message' => 'Time slots regenerated successfully',
                'days' => $days,
                'cleared' => $clearExisting ? $deleted ?? 0 : 0,
                'output' => trim($output),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to regenerate time slots',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Clean up old time slots
     */
    public function cleanup(Request $request): JsonResponse
    {
        try {
            $deleted = OrderTimeSlot::where('slot_date', '<', today())->delete();

            return response()->json([
                'message' => 'Old time slots cleaned up successfully',
                'deleted' => $deleted,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to cleanup time slots',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get time slot statistics
     */
    public function stats(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'location_id' => 'nullable|integer|exists:locations,id',
        ]);

        $query = OrderTimeSlot::query();

        if (isset($validated['location_id'])) {
            $query->where('location_id', $validated['location_id']);
        }

        $total = $query->count();
        $future = $query->where('slot_date', '>=', today())->count();
        $past = $query->where('slot_date', '<', today())->count();
        $fullyBooked = $query->whereColumn('current_orders', '>=', 'max_orders')->count();

        return response()->json([
            'data' => [
                'total_slots' => $total,
                'future_slots' => $future,
                'past_slots' => $past,
                'fully_booked' => $fullyBooked,
                'available' => $total - $fullyBooked,
            ],
        ]);
    }
}

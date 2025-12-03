<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OperatingHours;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class OperatingHoursController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $locationId = $request->get('location_id');
        
        $query = OperatingHours::with('location:id,name');
        
        if ($locationId) {
            $query->where('location_id', $locationId);
        }
        
        $hours = $query->orderBy('location_id')
            ->orderBy('day_of_week')
            ->orderBy('service_type')
            ->get()
            ->groupBy(['location_id', 'day_of_week', 'service_type']);
        
        return response()->json(['data' => $hours]);
    }

    public function getByLocation(Request $request, $locationId): JsonResponse
    {
        $hours = OperatingHours::where('location_id', $locationId)
            ->orderBy('day_of_week')
            ->orderBy('service_type')
            ->get()
            ->groupBy('day_of_week');
        
        return response()->json(['data' => $hours]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'location_id' => 'required|exists:locations,id',
            'day_of_week' => 'required|integer|between:0,6',
            'service_type' => 'required|in:dine-in,pickup,delivery',
            'opening_time' => 'required|date_format:H:i',
            'closing_time' => 'required|date_format:H:i|after:opening_time',
        ]);

        // Check for existing hours
        $exists = OperatingHours::where('location_id', $request->location_id)
            ->where('day_of_week', $request->day_of_week)
            ->where('service_type', $request->service_type)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Operating hours already exist for this day and service type'
            ], 422);
        }

        $hours = OperatingHours::create($request->all());
        
        return response()->json([
            'message' => 'Operating hours created successfully',
            'data' => $hours
        ], 201);
    }

    public function update(Request $request, OperatingHours $operatingHour): JsonResponse
    {
        $request->validate([
            'opening_time' => 'required|date_format:H:i',
            'closing_time' => 'required|date_format:H:i|after:opening_time',
        ]);

        $operatingHour->update([
            'opening_time' => $request->opening_time,
            'closing_time' => $request->closing_time,
        ]);

        return response()->json([
            'message' => 'Operating hours updated successfully',
            'data' => $operatingHour
        ]);
    }

    public function destroy(OperatingHours $operatingHour): JsonResponse
    {
        $operatingHour->delete();
        
        return response()->json([
            'message' => 'Operating hours deleted successfully'
        ]);
    }

    public function bulkUpdate(Request $request): JsonResponse
    {
        $request->validate([
            'location_id' => 'required|exists:locations,id',
            'service_type' => 'required|in:dine-in,pickup,delivery',
            'hours' => 'present|array',
            'hours.*.day_of_week' => 'required|integer|between:0,6',
            'hours.*.opening_time' => 'required|date_format:H:i',
            'hours.*.closing_time' => 'required|date_format:H:i',
        ]);

        DB::beginTransaction();
        try {
            // Delete existing hours for this location and service type
            // Use get() then delete() to ensure observers fire
            OperatingHours::where('location_id', $request->location_id)
                ->where('service_type', $request->service_type)
                ->get()
                ->each(function ($hour) {
                    $hour->delete();
                });

            // Create new hours
            foreach ($request->hours as $hour) {
                OperatingHours::create([
                    'location_id' => $request->location_id,
                    'day_of_week' => $hour['day_of_week'],
                    'service_type' => $request->service_type,
                    'opening_time' => $hour['opening_time'],
                    'closing_time' => $hour['closing_time'],
                ]);
            }

            DB::commit();
            return response()->json([
                'message' => 'Operating hours updated successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update operating hours: ' . $e->getMessage()
            ], 500);
        }
    }

    public function copyToAllDays(Request $request): JsonResponse
    {
        $request->validate([
            'location_id' => 'required|exists:locations,id',
            'source_day' => 'required|integer|between:0,6',
            'service_type' => 'required|in:dine-in,pickup,delivery',
        ]);

        $sourceHours = OperatingHours::where('location_id', $request->location_id)
            ->where('day_of_week', $request->source_day)
            ->where('service_type', $request->service_type)
            ->first();

        if (!$sourceHours) {
            return response()->json([
                'message' => 'No hours found for the source day'
            ], 404);
        }

        DB::beginTransaction();
        try {
            for ($day = 0; $day <= 6; $day++) {
                if ($day == $request->source_day) continue;

                OperatingHours::updateOrCreate(
                    [
                        'location_id' => $request->location_id,
                        'day_of_week' => $day,
                        'service_type' => $request->service_type,
                    ],
                    [
                        'opening_time' => $sourceHours->opening_time,
                        'closing_time' => $sourceHours->closing_time,
                    ]
                );
            }

            DB::commit();
            return response()->json([
                'message' => 'Hours copied to all days successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to copy hours: ' . $e->getMessage()
            ], 500);
        }
    }
}

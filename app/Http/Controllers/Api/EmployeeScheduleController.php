<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Shift;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmployeeScheduleController extends Controller
{
    /**
     * Get employee's shifts (upcoming and recent)
     */
    public function shifts(Request $request)
    {
        $user = $request->user();
        
        // Get employee record
        $employee = Employee::where('user_id', $user->id)->first();

        if (!$employee) {
            return response()->json([
                'message' => 'Employee profile not found',
                'data' => []
            ], 404);
        }

        // Get shifts from the past 30 days and future
        $startDate = now()->subDays(30)->toDateString();
        
        $shifts = Shift::with(['position', 'location'])
            ->where('employee_id', $employee->id)
            ->where('date', '>=', $startDate)
            ->orderBy('date', 'asc')
            ->orderBy('start_time', 'asc')
            ->get()
            ->map(function ($shift) {
                return [
                    'id' => $shift->id,
                    'employee_id' => $shift->employee_id,
                    'date' => $shift->date,
                    'start_time' => $shift->start_time,
                    'end_time' => $shift->end_time,
                    'position' => $shift->position->title ?? 'Staff',
                    'location_name' => $shift->location->name ?? 'Main Location',
                    'status' => $shift->status ?? 'scheduled',
                    'notes' => $shift->notes,
                ];
            });

        return response()->json([
            'data' => $shifts
        ]);
    }

    /**
     * Get specific shift details
     */
    public function showShift(Request $request, $id)
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->first();

        if (!$employee) {
            return response()->json(['message' => 'Employee profile not found'], 404);
        }

        $shift = Shift::with(['position', 'location'])
            ->where('id', $id)
            ->where('employee_id', $employee->id)
            ->first();

        if (!$shift) {
            return response()->json(['message' => 'Shift not found'], 404);
        }

        return response()->json([
            'data' => [
                'id' => $shift->id,
                'employee_id' => $shift->employee_id,
                'date' => $shift->date,
                'start_time' => $shift->start_time,
                'end_time' => $shift->end_time,
                'position' => $shift->position->title ?? 'Staff',
                'location_name' => $shift->location->name ?? 'Main Location',
                'status' => $shift->status ?? 'scheduled',
                'notes' => $shift->notes,
            ]
        ]);
    }
}

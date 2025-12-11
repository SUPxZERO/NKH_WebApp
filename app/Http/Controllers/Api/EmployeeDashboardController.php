<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Shift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

class EmployeeDashboardController extends Controller
{
    /**
     * Get employee dashboard statistics.
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->first();

        if (!$employee) {
            return response()->json([
                'message' => 'Employee profile not found'
            ], 404);
        }

        $now = Carbon::now();
        $startOfWeek = $now->copy()->startOfWeek();
        $endOfWeek = $now->copy()->endOfWeek();
        $startOfMonth = $now->copy()->startOfMonth();
        $endOfMonth = $now->copy()->endOfMonth();

        // Calculate hours this week
        $hoursThisWeek = Attendance::where('employee_id', $employee->id)
            ->where('clock_in_at', '>=', $startOfWeek)
            ->where('clock_in_at', '<=', $endOfWeek)
            ->whereNotNull('clock_out_at')
            ->get()
            ->sum(function ($attendance) {
                return $attendance->clock_in_at->diffInHours($attendance->clock_out_at);
            });

        // Calculate hours this month
        $hoursThisMonth = Attendance::where('employee_id', $employee->id)
            ->where('clock_in_at', '>=', $startOfMonth)
            ->where('clock_in_at', '<=', $endOfMonth)
            ->whereNotNull('clock_out_at')
            ->get()
            ->sum(function ($attendance) {
                return $attendance->clock_in_at->diffInHours($attendance->clock_out_at);
            });

        // Get actual shift for next shift logic
        $nextShift = Shift::where('employee_id', $employee->id)
            ->where('date', '>=', $now->toDateString())
            ->where('status', 'scheduled')
            ->orderBy('date', 'asc')
            ->orderBy('start_time', 'asc')
            ->with(['location'])
            ->first();

        // Check if next shift is today and if we need to show it differently
        // Logic remains the same for next shift selection

        $nextShiftData = null;
        if ($nextShift) {
            $nextShiftData = [
                'date' => $nextShift->date,
                'start_time' => $nextShift->start_time,
                'end_time' => $nextShift->end_time,
                'location_name' => $nextShift->location->name ?? 'Unknown',
            ];
        }

        return response()->json([
            'hours_this_week' => round($hoursThisWeek, 1),
            'hours_this_month' => round($hoursThisMonth, 1),
            'vacation_balance' => 10, // Metrics might be in a separate table, keeping placeholder for now
            'sick_balance' => 5,
            'personal_balance' => 2,
            'next_shift' => $nextShiftData,
        ]);
    }
}

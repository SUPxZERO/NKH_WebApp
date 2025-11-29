<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\AttendanceMetric;
use App\Models\Shift;
use App\Models\Employee;
use App\Models\Location;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AttendanceService
{
    /**
     * Calculate metrics after employee clocks out
     */
    public function calculateMetrics(Attendance $attendance): AttendanceMetric
    {
        if (!$attendance->clock_out_at) {
            throw new \Exception('Cannot calculate metrics without clock_out_at');
        }

        // Get the shift for this day if exists
        $clockInDate = $attendance->clock_in_at instanceof Carbon 
            ? $attendance->clock_in_at->toDateString()
            : Carbon::parse($attendance->clock_in_at)->toDateString();
        
        $shift = Shift::where('employee_id', $attendance->employee_id)
            ->where(DB::raw('DATE(date)'), '=', $clockInDate)
            ->first();

        $minutesLate = 0;
        $minutesEarlyDeparture = 0;

        // Ensure carbon instances
        $clockInTime = $attendance->clock_in_at instanceof Carbon 
            ? $attendance->clock_in_at 
            : Carbon::parse($attendance->clock_in_at);
        
        $clockOutTime = $attendance->clock_out_at instanceof Carbon 
            ? $attendance->clock_out_at 
            : ($attendance->clock_out_at ? Carbon::parse($attendance->clock_out_at) : null);

        // Calculate tardiness if shift exists
        if ($shift) {
            $shiftStart = Carbon::createFromTimeString($shift->start_time);
            $clockIn = $clockInTime->copy()->setTimeFromTimeString($clockInTime->format('H:i:s'));

            if ($clockIn->greaterThan($shiftStart)) {
                $minutesLate = $clockIn->diffInMinutes($shiftStart);
            }

            $shiftEnd = Carbon::createFromTimeString($shift->end_time);
            $clockOut = $clockOutTime->copy()->setTimeFromTimeString($clockOutTime->format('H:i:s'));

            if ($clockOut->lessThan($shiftEnd)) {
                $minutesEarlyDeparture = $shiftEnd->diffInMinutes($clockOut);
            }
        }

        // Calculate total hours
        $totalMinutes = $clockInTime->diffInMinutes($clockOutTime);
        $totalHours = round($totalMinutes / 60, 2);

        // Calculate overtime (assuming 8-hour shift)
        $overtimeHours = max(0, $totalHours - 8);

        // Delete existing metrics if any
        $attendance->attendanceMetrics()->delete();

        // Create new metrics
        $metric = AttendanceMetric::create([
            'employee_id' => $attendance->employee_id,
            'attendance_id' => $attendance->id,
            'minutes_late' => $minutesLate,
            'minutes_early_departure' => $minutesEarlyDeparture,
            'break_duration_minutes' => 0, // Can be set manually or via break tracking
            'total_shift_hours' => $totalHours,
            'overtime_hours' => $overtimeHours,
        ]);

        return $metric;
    }

    /**
     * Get daily report for an employee
     */
    public function getDailyReport(Employee $employee, Carbon $date): array
    {
        $attendances = Attendance::where('employee_id', $employee->id)
            ->whereDate('clock_in_at', $date->toDateString())
            ->with('attendanceMetrics')
            ->get();

        $totalHours = 0;
        $records = [];

        foreach ($attendances as $attendance) {
            if ($attendance->clock_out_at) {
                $hours = $attendance->clock_in_at->diffInHours($attendance->clock_out_at);
                $totalHours += $hours;

                $records[] = [
                    'id' => $attendance->id,
                    'clock_in' => $attendance->clock_in_at->format('H:i'),
                    'clock_out' => $attendance->clock_out_at->format('H:i'),
                    'hours' => round($hours, 2),
                    'metrics' => $attendance->attendanceMetrics()->first(),
                ];
            }
        }

        return [
            'employee_id' => $employee->id,
            'employee_name' => $employee->user->name,
            'date' => $date->toDateString(),
            'total_hours' => round($totalHours, 2),
            'records' => $records,
        ];
    }

    /**
     * Get attendance summary for period
     */
    public function getAttendanceSummary(Employee $employee, Carbon $from, Carbon $to): array
    {
        $attendances = Attendance::where('employee_id', $employee->id)
            ->whereBetween('clock_in_at', [$from, $to])
            ->with('attendanceMetrics')
            ->get();

        $totalHours = 0;
        $totalOvertime = 0;
        $lateCount = 0;

        foreach ($attendances as $attendance) {
            if ($attendance->clock_out_at) {
                $hours = $attendance->clock_in_at->diffInHours($attendance->clock_out_at);
                $totalHours += $hours;

                $metric = $attendance->attendanceMetrics()->first();
                if ($metric) {
                    $totalOvertime += $metric->overtime_hours;
                    if ($metric->minutes_late > 0) {
                        $lateCount++;
                    }
                }
            }
        }

        return [
            'employee_id' => $employee->id,
            'employee_name' => $employee->user->name,
            'period_from' => $from->toDateString(),
            'period_to' => $to->toDateString(),
            'total_attendance_days' => $attendances->unique('clock_in_at')->count(),
            'total_hours' => round($totalHours, 2),
            'total_overtime' => round($totalOvertime, 2),
            'late_days' => $lateCount,
            'average_hours_per_day' => round($totalHours / max(1, $attendances->count()), 2),
        ];
    }

    /**
     * Generate lateness report for location
     */
    public function generateLatenessReport(Location $location, Carbon $month): array
    {
        $attendances = Attendance::where('location_id', $location->id)
            ->whereMonth('clock_in_at', $month->month)
            ->whereYear('clock_in_at', $month->year)
            ->with('employee.user', 'attendanceMetrics')
            ->get();

        $report = [];

        foreach ($attendances->groupBy('employee_id') as $employeeId => $employeeAttendances) {
            $lateCount = 0;
            $totalLateMinutes = 0;

            foreach ($employeeAttendances as $attendance) {
                $metric = $attendance->attendanceMetrics()->first();
                if ($metric && $metric->minutes_late > 0) {
                    $lateCount++;
                    $totalLateMinutes += $metric->minutes_late;
                }
            }

            if ($lateCount > 0) {
                $employee = $employeeAttendances->first()->employee;
                $report[] = [
                    'employee_id' => $employeeId,
                    'employee_name' => $employee->user->name,
                    'late_days' => $lateCount,
                    'total_late_minutes' => $totalLateMinutes,
                    'average_late_minutes' => round($totalLateMinutes / $lateCount, 2),
                ];
            }
        }

        return $report;
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\AttendanceMetric;
use App\Models\Employee;
use App\Services\AttendanceService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AttendanceController extends Controller
{
    protected $attendanceService;

    public function __construct(AttendanceService $attendanceService)
    {
        $this->attendanceService = $attendanceService;
    }

    /**
     * Clock in an employee
     */
    public function clockIn(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'location_id' => 'required|exists:locations,id',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            // Check if already clocked in today
            $existing = Attendance::where('employee_id', $validated['employee_id'])
                ->where('location_id', $validated['location_id'])
                ->whereDate('clock_in_at', today())
                ->whereNull('clock_out_at')
                ->first();

            if ($existing) {
                return response()->json([
                    'message' => 'Employee is already clocked in',
                    'status' => 'already_clocked_in',
                ], 409);
            }

            // Create new attendance record
            $attendance = Attendance::create([
                'employee_id' => $validated['employee_id'],
                'location_id' => $validated['location_id'],
                'clock_in_at' => now(),
                'notes' => $validated['notes'] ?? null,
            ]);

            return response()->json([
                'message' => 'Successfully clocked in',
                'data' => [
                    'id' => $attendance->id,
                    'employee_id' => $attendance->employee_id,
                    'clock_in_at' => $attendance->clock_in_at->format('Y-m-d H:i:s'),
                    'status' => 'clocked_in',
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to clock in',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Clock out an employee
     */
    public function clockOut(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'attendance_id' => 'required|exists:attendances,id',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $attendance = Attendance::findOrFail($validated['attendance_id']);

            if ($attendance->clock_out_at !== null) {
                return response()->json([
                    'message' => 'Employee is already clocked out',
                    'status' => 'already_clocked_out',
                ], 409);
            }

            DB::transaction(function () use ($attendance, $validated) {
                // Update clock out time
                $attendance->update([
                    'clock_out_at' => now(),
                ]);

                if (isset($validated['notes'])) {
                    $attendance->notes = ($attendance->notes ?? '') . "\n[Clock Out]: " . $validated['notes'];
                    $attendance->save();
                }

                // Calculate and create metrics
                $this->attendanceService->calculateMetrics($attendance);
            });

            // Calculate total hours
            $totalHours = $attendance->clock_in_at->diffInHours($attendance->clock_out_at);

            return response()->json([
                'message' => 'Successfully clocked out',
                'data' => [
                    'id' => $attendance->id,
                    'employee_id' => $attendance->employee_id,
                    'clock_in_at' => $attendance->clock_in_at->format('Y-m-d H:i:s'),
                    'clock_out_at' => $attendance->clock_out_at->format('Y-m-d H:i:s'),
                    'total_hours' => round($totalHours, 2),
                    'status' => 'clocked_out',
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to clock out',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get current status for employee
     */
    public function today(Request $request): JsonResponse
    {
        $employeeId = $request->user()->employee?->id ?? $request->input('employee_id');

        if (!$employeeId) {
            return response()->json([
                'message' => 'Employee not found',
            ], 404);
        }

        try {
            $currentAttendance = Attendance::where('employee_id', $employeeId)
                ->whereDate('clock_in_at', today())
                ->latest('clock_in_at')
                ->first();

            $todayRecords = Attendance::where('employee_id', $employeeId)
                ->whereDate('clock_in_at', today())
                ->orderBy('clock_in_at')
                ->get();

            $status = 'clocked_out';
            if ($currentAttendance && $currentAttendance->clock_out_at === null) {
                $status = 'clocked_in';
            }

            return response()->json([
                'current_status' => $status,
                'current_attendance' => $currentAttendance ? [
                    'id' => $currentAttendance->id,
                    'clock_in_at' => $currentAttendance->clock_in_at->format('Y-m-d H:i:s'),
                    'clock_out_at' => $currentAttendance->clock_out_at?->format('Y-m-d H:i:s'),
                ] : null,
                'today_records' => $todayRecords->map(function ($record) {
                    return [
                        'id' => $record->id,
                        'clock_in_at' => $record->clock_in_at->format('Y-m-d H:i:s'),
                        'clock_out_at' => $record->clock_out_at?->format('Y-m-d H:i:s'),
                        'total_hours' => $record->clock_out_at ? round($record->clock_in_at->diffInHours($record->clock_out_at), 2) : null,
                    ];
                }),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve attendance',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get attendance history
     */
    public function history(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        try {
            $query = Attendance::where('employee_id', $validated['employee_id'])
                ->with('employee.user');

            if ($validated['from'] ?? null) {
                $query->whereDate('clock_in_at', '>=', $validated['from']);
            }

            if ($validated['to'] ?? null) {
                $query->whereDate('clock_in_at', '<=', $validated['to']);
            }

            $records = $query->orderBy('clock_in_at', 'desc')
                ->paginate($validated['per_page'] ?? 50);

            return response()->json([
                'data' => $records->map(function ($record) {
                    return [
                        'id' => $record->id,
                        'employee_name' => $record->employee->user->name,
                        'clock_in_at' => $record->clock_in_at->format('Y-m-d H:i:s'),
                        'clock_out_at' => $record->clock_out_at?->format('Y-m-d H:i:s'),
                        'total_hours' => $record->clock_out_at ? round($record->clock_in_at->diffInHours($record->clock_out_at), 2) : null,
                        'location' => $record->location->name,
                        'metrics' => $record->attendanceMetrics()->first(),
                    ];
                }),
                'pagination' => [
                    'total' => $records->total(),
                    'per_page' => $records->perPage(),
                    'current_page' => $records->currentPage(),
                    'last_page' => $records->lastPage(),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve history',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Manually adjust attendance record
     */
    public function adjust(Request $request, Attendance $attendance): JsonResponse
    {
        $validated = $request->validate([
            'clock_in_at' => 'nullable|date_format:Y-m-d H:i:s',
            'clock_out_at' => 'nullable|date_format:Y-m-d H:i:s',
            'notes' => 'nullable|string|max:500',
            'reason' => 'required|string|max:255',
        ]);

        try {
            DB::transaction(function () use ($attendance, $validated) {
                $oldValues = [
                    'clock_in_at' => $attendance->clock_in_at->format('Y-m-d H:i:s'),
                    'clock_out_at' => $attendance->clock_out_at?->format('Y-m-d H:i:s'),
                ];

                if ($validated['clock_in_at'] ?? null) {
                    $attendance->clock_in_at = $validated['clock_in_at'];
                }

                if ($validated['clock_out_at'] ?? null) {
                    $attendance->clock_out_at = $validated['clock_out_at'];
                }

                $attendance->notes = ($attendance->notes ?? '') . "\n[Adjustment]: " . $validated['reason'];
                $attendance->save();

                // Recalculate metrics if clock out exists
                if ($attendance->clock_out_at) {
                    $attendance->attendanceMetrics()->delete();
                    $this->attendanceService->calculateMetrics($attendance);
                }

                // Log to employment history
                $attendance->employee->employmentHistory()->create([
                    'action' => 'attendance_adjustment',
                    'previous_value' => $oldValues,
                    'new_value' => [
                        'clock_in_at' => $attendance->clock_in_at->format('Y-m-d H:i:s'),
                        'clock_out_at' => $attendance->clock_out_at?->format('Y-m-d H:i:s'),
                    ],
                    'changed_by_user_id' => auth()->id(),
                    'effective_date' => today(),
                    'notes' => $validated['reason'],
                ]);
            });

            return response()->json([
                'message' => 'Attendance record adjusted successfully',
                'data' => $attendance->fresh(),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to adjust attendance',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

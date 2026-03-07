<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use App\Models\Employee;
use App\Http\Resources\ShiftResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ShiftController extends Controller
{
    /**
     * Display a listing of shifts
     */
    public function index(Request $request): JsonResponse
    {
        $query = Shift::with(['employee.user', 'employee.position', 'location', 'position']);

        // Filter by date range
        if ($request->has('date_from')) {
            $query->where('start_time', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->where('end_time', '<=', $request->date_to);
        }

        // Filter by employee
        if ($request->has('employee_id') && $request->employee_id !== 'all') {
            $query->where('employee_id', $request->employee_id);
        }

        // Filter by location
        if ($request->has('location_id') && $request->location_id !== 'all') {
            $query->where('location_id', $request->location_id);
        }

        // Filter by position
        if ($request->has('position_id') && $request->position_id !== 'all') {
            $query->where('position_id', $request->position_id);
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('employee.user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'start_time');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->get('per_page', 50);
        $shifts = $query->paginate($perPage);

        return ShiftResource::collection($shifts);
    }

    /**
     * Get schedule for a specific date/week/month
     */
    public function schedule(Request $request): JsonResponse
    {
        $date = $request->get('date', now()->toDateString());
        $view = $request->get('view', 'week'); // day, week, month

        $startDate = Carbon::parse($date);

        switch ($view) {
            case 'day':
                $endDate = $startDate->copy()->endOfDay();
                break;
            case 'week':
                $startDate = $startDate->startOfWeek();
                $endDate = $startDate->copy()->endOfWeek();
                break;
            case 'month':
                $startDate = $startDate->startOfMonth();
                $endDate = $startDate->copy()->endOfMonth();
                break;
            default:
                $endDate = $startDate->copy()->endOfWeek();
        }

        $shifts = Shift::with(['employee.user', 'employee.position', 'location', 'position'])
            ->whereBetween('start_time', [$startDate, $endDate])
            ->orderBy('start_time')
            ->get();

        return response()->json([
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'view' => $view,
            'shifts' => ShiftResource::collection($shifts)
        ]);
    }

    /**
     * Store a newly created shift
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'location_id' => 'nullable|exists:locations,id',
            'position_id' => 'nullable|exists:positions,id',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'shift_type' => 'nullable|in:morning,afternoon,evening,night,split',
            'notes' => 'nullable|string',
            'status' => 'nullable|in:draft,published,scheduled,in-progress,completed,cancelled'
        ]);

        // Check for conflicts
        $conflicts = $this->checkConflicts(
            $validated['employee_id'],
            $validated['start_time'],
            $validated['end_time']
        );

        if ($conflicts->count() > 0) {
            return response()->json([
                'message' => 'Shift conflicts with existing shifts',
                'conflicts' => $conflicts
            ], 422);
        }

        // Check if employee is active
        $employee = Employee::find($validated['employee_id']);
        if (!$employee || $employee->status !== 'active') {
            return response()->json(['message' => 'Cannot assign shift to inactive employee'], 422);
        }

        // Format dates for database
        $startTime = Carbon::parse($validated['start_time']);
        $endTime = Carbon::parse($validated['end_time']);

        $shiftData = array_merge($validated, [
            'start_time' => $startTime->format('Y-m-d H:i:s'),
            'end_time' => $endTime->format('Y-m-d H:i:s'),
            'date' => $startTime->toDateString(),
            'position_id' => $validated['position_id'] ?? $employee->position_id,
            'shift_type' => $validated['shift_type'] ?? 'morning',
            'location_id' => $validated['location_id'] ?? $request->user()?->getActiveBranchId() ?? $employee->location_id,
            'notes' => $validated['notes'] ?? null,
        ]);

        // Status is guarded, so we create with allowed fields then manually update status
        // Or we use forceFill/new instance + save()
        $shift = new Shift($shiftData);
        $shift->status = $validated['status'] ?? 'draft';
        if ($shift->status === 'published') {
            $shift->published_at = now();
        }
        $shift->save();

        $shift->load(['employee.user', 'employee.position', 'location', 'position']);

        return response()->json([
            'message' => 'Shift created successfully',
            'data' => new ShiftResource($shift)
        ], 201);
    }

    /**
     * Display the specified shift
     */
    public function show(Shift $shift): JsonResponse
    {
        $shift->load(['employee.user', 'employee.position', 'location', 'position']);

        return response()->json([
            'data' => new ShiftResource($shift)
        ]);
    }

    /**
     * Update the specified shift
     */
    public function update(Request $request, Shift $shift): JsonResponse
    {
        // Cannot edit completed or cancelled shifts
        if (in_array($shift->status, ['completed', 'cancelled'])) {
            return response()->json([
                'message' => 'Cannot edit completed or cancelled shifts'
            ], 422);
        }

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'location_id' => 'nullable|exists:locations,id',
            'position_id' => 'nullable|exists:positions,id',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'shift_type' => 'nullable|in:morning,afternoon,evening,night,split',
            'notes' => 'nullable|string',
            'status' => 'nullable|in:draft,published,scheduled,in-progress,completed,cancelled'
        ]);

        if (isset($validated['employee_id'])) {
            // Check if employee is active
            $employee = Employee::find($validated['employee_id']);
            if (!$employee || $employee->status !== 'active') {
                return response()->json(['message' => 'Cannot assign shift to inactive employee'], 422);
            }
        }

        // Format dates for database
        if (isset($validated['start_time'])) {
            $validated['start_time'] = Carbon::parse($validated['start_time'])->format('Y-m-d H:i:s');
            // Update date if start_time changes
            $validated['date'] = Carbon::parse($validated['start_time'])->toDateString();
        }
        if (isset($validated['end_time'])) {
            $validated['end_time'] = Carbon::parse($validated['end_time'])->format('Y-m-d H:i:s');
        }

        // Check for conflicts (excluding current shift)
        $conflicts = $this->checkConflicts(
            $validated['employee_id'],
            $validated['start_time'],
            $validated['end_time'],
            $shift->id
        );

        if ($conflicts->count() > 0) {
            return response()->json([
                'message' => 'Shift conflicts with existing shifts',
                'conflicts' => $conflicts
            ], 422);
        }

        $shift->fill($validated);

        // Manual handling of guarded status
        if (isset($validated['status'])) {
            $shift->status = $validated['status'];
            if ($shift->status === 'published' && !$shift->published_at) {
                $shift->published_at = now();
            }
        }

        $shift->save();
        $shift->load(['employee.user', 'employee.position', 'location', 'position']);

        return response()->json([
            'message' => 'Shift updated successfully',
            'data' => new ShiftResource($shift)
        ]);
    }

    /**
     * Remove the specified shift
     */
    public function destroy(Shift $shift): JsonResponse
    {
        // Cannot delete completed shifts
        if ($shift->status === 'completed') {
            return response()->json([
                'message' => 'Cannot delete completed shifts'
            ], 422);
        }

        $shift->delete();

        return response()->json([
            'message' => 'Shift deleted successfully'
        ]);
    }

    /**
     * Publish shift schedule
     */
    public function publish(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'shift_ids' => 'required|array',
            'shift_ids.*' => 'exists:shifts,id'
        ]);

        // Manually update both status and published_at for multiple records
        // Note: Eloquent mass update doesn't fire events, but here we just need to set values.
        // However, status and published_at are guarded, so mass assignment might behave differently depending on how we call it.
        // update() method on Builder ignores guarded attributes generally, which is good.
        Shift::whereIn('id', $validated['shift_ids'])
            ->update([
                'status' => 'published',
                'published_at' => now()
            ]);

        return response()->json([
            'message' => 'Shifts published successfully'
        ]);
    }

    /**
     * Check for shift conflicts
     * 
     * @param int $employeeId Employee ID
     * @param string $startTime Full datetime string (e.g., "2026-02-27 07:00:00")
     * @param string $endTime Full datetime string (e.g., "2026-02-27 21:00:00")
     * @param int|null $excludeShiftId Shift ID to exclude (for updates)
     */
    private function checkConflicts($employeeId, $startTime, $endTime, $excludeShiftId = null)
    {
        // Parse datetime inputs
        $startDt = Carbon::parse($startTime);
        $endDt = Carbon::parse($endTime);

        // Extract date and time separately (DB stores them separately)
        $date = $startDt->toDateString(); // "2026-02-27"
        $startTimeOnly = $startDt->format('H:i:s'); // "07:00:00"
        $endTimeOnly = $endDt->format('H:i:s'); // "21:00:00"

        // Check for overlaps on the SAME DATE only
        // Overlap condition: StartA < EndB AND EndA > StartB
        $query = Shift::where('employee_id', $employeeId)
            ->where('date', $date) // <-- CRITICAL: Filter by date first!
            ->where('start_time', '<', $endTimeOnly)
            ->where('end_time', '>', $startTimeOnly)
            ->whereNotIn('status', ['cancelled']);

        if ($excludeShiftId) {
            $query->where('id', '!=', $excludeShiftId);
        }

        return $query->get();
    }

    /**
     * Get conflicts for a shift
     */
    public function conflicts(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'exclude_shift_id' => 'nullable|exists:shifts,id'
        ]);

        $conflicts = $this->checkConflicts(
            $validated['employee_id'],
            $validated['start_time'],
            $validated['end_time'],
            $validated['exclude_shift_id'] ?? null
        );

        return response()->json([
            'has_conflicts' => $conflicts->count() > 0,
            'conflicts' => $conflicts
        ]);
    }

    /**
     * Get shift statistics
     */
    public function stats(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date') ? Carbon::parse($request->start_date)->startOfDay() : now()->startOfMonth();
        $endDate = $request->get('end_date') ? Carbon::parse($request->end_date)->endOfDay() : now()->endOfMonth();

        $stats = [
            'total_shifts' => Shift::whereBetween('start_time', [$startDate, $endDate])->count(),
            'published' => Shift::whereBetween('start_time', [$startDate, $endDate])
                ->where('status', 'published')->count(),
            'draft' => Shift::whereBetween('start_time', [$startDate, $endDate])
                ->where('status', 'draft')->count(),
            'completed' => Shift::whereBetween('start_time', [$startDate, $endDate])
                ->where('status', 'completed')->count(),
            'total_hours' => Shift::whereBetween('start_time', [$startDate, $endDate])
                ->selectRaw('SUM(TIMESTAMPDIFF(HOUR, start_time, end_time)) as total')
                ->value('total') ?? 0,
            'by_employee' => Shift::whereBetween('start_time', [$startDate, $endDate])
                ->select('employee_id', DB::raw('count(*) as count'))
                ->groupBy('employee_id')
                ->with('employee.user')
                ->get()
        ];

        return response()->json($stats);
    }

    /**
     * Copy shifts to another week
     */
    public function copy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'source_start_date' => 'required|date',
            'target_start_date' => 'required|date',
            'location_id' => 'nullable|exists:locations,id'
        ]);

        $sourceStart = Carbon::parse($validated['source_start_date'])->startOfWeek();
        $sourceEnd = $sourceStart->copy()->endOfWeek();
        $targetStart = Carbon::parse($validated['target_start_date'])->startOfWeek();

        $query = Shift::whereBetween('start_time', [$sourceStart, $sourceEnd]);

        if (isset($validated['location_id'])) {
            $query->where('location_id', $validated['location_id']);
        }

        $sourceShifts = $query->get();
        $daysDiff = $sourceStart->diffInDays($targetStart);

        $copiedShifts = [];
        foreach ($sourceShifts as $shift) {
            $newShift = $shift->replicate();
            $newShift->start_time = Carbon::parse($shift->start_time)->addDays($daysDiff);
            $newShift->end_time = Carbon::parse($shift->end_time)->addDays($daysDiff);
            $newShift->date = Carbon::parse($newShift->start_time)->toDateString(); // Ensure date is set because we replicate
            $newShift->status = 'draft';
            $newShift->save();
            $copiedShifts[] = $newShift;
        }

        return response()->json([
            'message' => 'Shifts copied successfully',
            'count' => count($copiedShifts),
            'data' => ShiftResource::collection($copiedShifts)
        ]);
    }
}

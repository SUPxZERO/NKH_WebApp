<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TimeOffRequest;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TimeOffRequestController extends Controller
{
    /**
     * Display a listing of time-off requests
     */
    public function index(Request $request): JsonResponse
    {
        $query = TimeOffRequest::with(['employee', 'approvedBy']);

        // Filter by employee
        if ($request->has('employee_id') && $request->employee_id !== 'all') {
            $query->where('employee_id', $request->employee_id);
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by type
        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        // Filter by date range
        if ($request->has('date_from')) {
            $query->where('end_date', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->where('start_date', '<=', $request->date_to);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('employee', function ($eq) use ($search) {
                    $eq->where('name', 'like', "%{$search}%");
                })->orWhere('reason', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->get('per_page', 15);
        $requests = $query->paginate($perPage);

        return response()->json($requests);
    }

    /**
     * Store a newly created time-off request
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'type' => 'required|in:vacation,sick_leave,personal,bereavement,maternity,paternity,unpaid,other',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string|max:500',
            'notes' => 'nullable|string'
        ]);

        // Check for overlapping requests
        $overlapping = TimeOffRequest::where('employee_id', $validated['employee_id'])
            ->where('status', '!=', 'rejected')
            ->where(function ($q) use ($validated) {
                $q->whereBetween('start_date', [$validated['start_date'], $validated['end_date']])
                    ->orWhereBetween('end_date', [$validated['start_date'], $validated['end_date']])
                    ->orWhere(function ($q2) use ($validated) {
                        $q2->where('start_date', '<=', $validated['start_date'])
                            ->where('end_date', '>=', $validated['end_date']);
                    });
            })
            ->exists();

        if ($overlapping) {
            return response()->json([
                'message' => 'You already have a time-off request for this period'
            ], 422);
        }

        // Calculate days requested
        $startDate = Carbon::parse($validated['start_date']);
        $endDate = Carbon::parse($validated['end_date']);
        $daysRequested = $startDate->diffInDays($endDate) + 1;

        $timeOffRequest = TimeOffRequest::create([
            'employee_id' => $validated['employee_id'],
            'type' => $validated['type'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'days_requested' => $daysRequested,
            'reason' => $validated['reason'],
            'notes' => $validated['notes'] ?? null,
            'status' => 'pending'
        ]);

        $timeOffRequest->load(['employee']);

        return response()->json([
            'message' => 'Time-off request submitted successfully',
            'data' => $timeOffRequest
        ], 201);
    }

    /**
     * Display the specified time-off request
     */
    public function show(TimeOffRequest $timeOffRequest): JsonResponse
    {
        $timeOffRequest->load(['employee', 'approvedBy']);
        
        return response()->json([
            'data' => $timeOffRequest
        ]);
    }

    /**
     * Update the specified time-off request
     */
    public function update(Request $request, TimeOffRequest $timeOffRequest): JsonResponse
    {
        // Cannot edit approved or rejected requests
        if ($timeOffRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Can only edit pending time-off requests'
            ], 422);
        }

        $validated = $request->validate([
            'type' => 'required|in:vacation,sick_leave,personal,bereavement,maternity,paternity,unpaid,other',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string|max:500',
            'notes' => 'nullable|string'
        ]);

        // Check for overlapping requests (excluding current one)
        $overlapping = TimeOffRequest::where('employee_id', $timeOffRequest->employee_id)
            ->where('id', '!=', $timeOffRequest->id)
            ->where('status', '!=', 'rejected')
            ->where(function ($q) use ($validated) {
                $q->whereBetween('start_date', [$validated['start_date'], $validated['end_date']])
                    ->orWhereBetween('end_date', [$validated['start_date'], $validated['end_date']])
                    ->orWhere(function ($q2) use ($validated) {
                        $q2->where('start_date', '<=', $validated['start_date'])
                            ->where('end_date', '>=', $validated['end_date']);
                    });
            })
            ->exists();

        if ($overlapping) {
            return response()->json([
                'message' => 'This conflicts with another time-off request'
            ], 422);
        }

        // Recalculate days
        $startDate = Carbon::parse($validated['start_date']);
        $endDate = Carbon::parse($validated['end_date']);
        $daysRequested = $startDate->diffInDays($endDate) + 1;

        $timeOffRequest->update([
            ...$validated,
            'days_requested' => $daysRequested
        ]);

        $timeOffRequest->load(['employee']);

        return response()->json([
            'message' => 'Time-off request updated successfully',
            'data' => $timeOffRequest
        ]);
    }

    /**
     * Remove the specified time-off request
     */
    public function destroy(TimeOffRequest $timeOffRequest): JsonResponse
    {
        // Can only delete pending or rejected requests
        if ($timeOffRequest->status === 'approved') {
            return response()->json([
                'message' => 'Cannot delete approved time-off requests. Please reject first.'
            ], 422);
        }

        $timeOffRequest->delete();

        return response()->json([
            'message' => 'Time-off request deleted successfully'
        ]);
    }

    /**
     * Approve time-off request
     */
    public function approve(Request $request, TimeOffRequest $timeOffRequest): JsonResponse
    {
        if ($timeOffRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Can only approve pending requests'
            ], 422);
        }

        $validated = $request->validate([
            'approved_by' => 'required|exists:employees,id',
            'approval_notes' => 'nullable|string|max:500'
        ]);

        // Cannot approve own request
        if ($timeOffRequest->employee_id == $validated['approved_by']) {
            return response()->json([
                'message' => 'Cannot approve your own time-off request'
            ], 422);
        }

        $timeOffRequest->update([
            'status' => 'approved',
            'approved_by' => $validated['approved_by'],
            'approval_notes' => $validated['approval_notes'] ?? null,
            'approved_at' => now()
        ]);

        $timeOffRequest->load(['employee', 'approvedBy']);

        return response()->json([
            'message' => 'Time-off request approved successfully',
            'data' => $timeOffRequest
        ]);
    }

    /**
     * Reject time-off request
     */
    public function reject(Request $request, TimeOffRequest $timeOffRequest): JsonResponse
    {
        if ($timeOffRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Can only reject pending requests'
            ], 422);
        }

        $validated = $request->validate([
            'approved_by' => 'required|exists:employees,id',
            'approval_notes' => 'required|string|max:500'
        ]);

        // Cannot reject own request
        if ($timeOffRequest->employee_id == $validated['approved_by']) {
            return response()->json([
                'message' => 'Cannot reject your own time-off request'
            ], 422);
        }

        $timeOffRequest->update([
            'status' => 'rejected',
            'approved_by' => $validated['approved_by'],
            'approval_notes' => $validated['approval_notes'],
            'approved_at' => now()
        ]);

        $timeOffRequest->load(['employee', 'approvedBy']);

        return response()->json([
            'message' => 'Time-off request rejected',
            'data' => $timeOffRequest
        ]);
    }

    /**
     * Get time-off balance for an employee
     */
    public function balance(Request $request, $employeeId): JsonResponse
    {
        $employee = Employee::findOrFail($employeeId);
        $year = $request->get('year', now()->year);

        $approved = TimeOffRequest::where('employee_id', $employeeId)
            ->where('status', 'approved')
            ->whereYear('start_date', $year)
            ->sum('days_requested');

        $pending = TimeOffRequest::where('employee_id', $employeeId)
            ->where('status', 'pending')
            ->whereYear('start_date', $year)
            ->sum('days_requested');

        // Assuming each employee  gets 20 vacation days per year (can be customized)
        $totalAllowed = 20;
        $remaining = $totalAllowed - $approved;

        return response()->json([
            'employee_id' => $employeeId,
            'employee_name' => $employee->name,
            'year' => $year,
            'total_allowed' => $totalAllowed,
            'days_taken' => $approved,
            'days_pending' => $pending,
            'days_remaining' => max(0, $remaining)
        ]);
    }

    /**
     * Get statistics for time-off requests
     */
    public function stats(Request $request): JsonResponse
    {
        $year = $request->get('year', now()->year);

        $stats = [
            'total_requests' => TimeOffRequest::whereYear('created_at', $year)->count(),
            'pending' => TimeOffRequest::where('status', 'pending')->count(),
            'approved' => TimeOffRequest::whereYear('created_at', $year)
                ->where('status', 'approved')->count(),
            'rejected' => TimeOffRequest::whereYear('created_at', $year)
                ->where('status', 'rejected')->count(),
            'total_days_approved' => TimeOffRequest::whereYear('start_date', $year)
                ->where('status', 'approved')
                ->sum('days_requested'),
            'by_type' => TimeOffRequest::whereYear('created_at', $year)
                ->select('type', DB::raw('count(*) as count'), DB::raw('sum(days_requested) as days'))
                ->groupBy('type')
                ->get(),
            'upcoming' => TimeOffRequest::where('status', 'approved')
                ->where('start_date', '>=', now())
                ->where('start_date', '<=', now()->addDays(30))
                ->with('employee')
                ->get()
        ];

        return response()->json($stats);
    }

    /**
     * Get calendar events for time-off
     */
    public function calendar(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', now()->endOfMonth()->toDateString());

        $requests = TimeOffRequest::with('employee')
            ->where('status', 'approved')
            ->where(function ($q) use ($startDate, $endDate) {
                $q->whereBetween('start_date', [$startDate, $endDate])
                    ->orWhereBetween('end_date', [$startDate, $endDate])
                    ->orWhere(function ($q2) use ($startDate, $endDate) {
                        $q2->where('start_date', '<=', $startDate)
                            ->where('end_date', '>=', $endDate);
                    });
            })
            ->get();

        return response()->json($requests);
    }
}

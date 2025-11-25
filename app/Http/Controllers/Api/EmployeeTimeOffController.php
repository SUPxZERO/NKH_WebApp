<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class EmployeeTimeOffController extends Controller
{
    /**
     * Get employee's time off requests
     */
    public function index(Request $request)
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

        // Get time off requests
        $requests = DB::table('time_off_requests')
            ->where('employee_id', $employee->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($request) {
                return [
                    'id' => $request->id,
                    'employee_id' => $request->employee_id,
                    'start_date' => $request->start_date,
                    'end_date' => $request->end_date,
                    'reason' => $request->reason,
                    'status' => $request->status,
                    'created_at' => $request->created_at,
                    'updated_at' => $request->updated_at,
                ];
            });

        return response()->json([
            'data' => $requests
        ]);
    }

    /**
     * Submit a new time off request
     */
    public function store(Request $request)
    {
        $user = $request->user();
        
        // Get employee record
        $employee = Employee::where('user_id', $user->id)->first();

        if (!$employee) {
            return response()->json([
                'message' => 'Employee profile not found'
            ], 404);
        }

        // Validate request
        $validator = Validator::make($request->all(), [
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check for overlapping requests
        $overlap = DB::table('time_off_requests')
            ->where('employee_id', $employee->id)
            ->where('status', '!=', 'denied')
            ->where(function ($query) use ($request) {
                $query->whereBetween('start_date', [$request->start_date, $request->end_date])
                      ->orWhereBetween('end_date', [$request->start_date, $request->end_date])
                      ->orWhere(function ($q) use ($request) {
                          $q->where('start_date', '<=', $request->start_date)
                            ->where('end_date', '>=', $request->end_date);
                      });
            })
            ->exists();

        if ($overlap) {
            return response()->json([
                'message' => 'You already have a time off request for these dates'
            ], 422);
        }

        // Create time off request
        $timeOffId = DB::table('time_off_requests')->insertGetId([
            'employee_id' => $employee->id,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'reason' => $request->reason,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $timeOff = DB::table('time_off_requests')->where('id', $timeOffId)->first();

        return response()->json([
            'message' => 'Time off request submitted successfully',
            'data' => [
                'id' => $timeOff->id,
                'employee_id' => $timeOff->employee_id,
                'start_date' => $timeOff->start_date,
                'end_date' => $timeOff->end_date,
                'reason' => $timeOff->reason,
                'status' => $timeOff->status,
                'created_at' => $timeOff->created_at,
            ]
        ], 201);
    }

    /**
     * Cancel a pending time off request
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->first();

        if (!$employee) {
            return response()->json(['message' => 'Employee profile not found'], 404);
        }

        $timeOff = DB::table('time_off_requests')
            ->where('id', $id)
            ->where('employee_id', $employee->id)
            ->first();

        if (!$timeOff) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        if ($timeOff->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending requests can be cancelled'
            ], 422);
        }

        DB::table('time_off_requests')->where('id', $id)->delete();

        return response()->json([
            'message' => 'Time off request cancelled successfully'
        ]);
    }
}

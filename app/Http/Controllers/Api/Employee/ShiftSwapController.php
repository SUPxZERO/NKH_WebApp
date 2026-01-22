<?php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Models\ShiftSwap;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ShiftSwapController extends Controller
{
    /**
     * List swaps with filtering
     */
    public function index(Request $request)
    {
        $employee = $request->user()->employee;
        
        if (!$employee) {
            return response()->json(['data' => []]);
        }
        
        $employeeId = $employee->id;
        $view = $request->query('view', 'all'); // 'my_requests', 'available', 'all'
        
        $query = ShiftSwap::with(['requester.user', 'shift.location', 'shift.position'])
            ->latest();

        if ($view === 'my_requests') {
            $query->where('requester_id', $employeeId);
        } elseif ($view === 'available') {
            $query->where('type', 'give_away')
                  ->where('status', 'pending')
                  ->where('requester_id', '!=', $employeeId)
                  ->where(function($q) use ($employeeId) {
                      $q->whereNull('recipient_id')
                        ->orWhere('recipient_id', $employeeId);
                  });
        } else {
             // Fallback: show everything relevant to me
             $query->where(function($q) use ($employeeId) {
                $q->where('requester_id', $employeeId)
                  ->orWhere('recipient_id', $employeeId)
                  ->orWhere(function($sub) use ($employeeId) {
                      $sub->whereNull('recipient_id')
                          ->where('type', 'give_away')
                          ->where('requester_id', '!=', $employeeId);
                  });
            });
        }
        
        // Execute the query and return results
        $swaps = $query->get();
            
        return response()->json(['data' => $swaps]);
    }

    /**
     * Create a new swap request
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'shift_id' => 'required|exists:shifts,id',
            'type' => 'required|in:give_away,trade',
            'recipient_id' => 'nullable|exists:employees,id',
            'reason' => 'nullable|string',
        ]);
        
        // Get the employee record for the authenticated user
        $employee = $request->user()->employee;
        
        if (!$employee) {
            return response()->json(['message' => 'Employee profile not found.'], 404);
        }
        
        // Prevent duplicate active requests for same shift
        if (ShiftSwap::where('shift_id', $validated['shift_id'])
            ->whereIn('status', ['pending', 'accepted_by_peer'])
            ->exists()) {
             return response()->json(['message' => 'An active request already exists for this shift.'], 422);
        }

        $swap = ShiftSwap::create([
            'requester_id' => $employee->id,
            'shift_id' => $validated['shift_id'],
            'recipient_id' => $validated['recipient_id'] ?? null,
            'type' => $validated['type'],
            'status' => 'pending',
            'reason' => $validated['reason'] ?? null,
        ]);

        return response()->json($swap->load(['requester.user', 'shift.location', 'shift.position']), 201);

    }
    
    /**
     * Interact with swap (cancel, claim/accept)
     */
    public function update(Request $request, $id)
    {
        $swap = ShiftSwap::findOrFail($id);
        $user = $request->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['message' => 'Employee profile not found.'], 404);
        }

        $action = $request->input('action'); // 'cancel', 'claim'
        
        if ($action === 'cancel') {
            // Check against employee ID, not user ID
            if ($swap->requester_id !== $employee->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            $swap->update(['status' => 'cancelled']);
            return response()->json($swap);
        }
        
        if ($action === 'claim') {
            // Check against employee ID
            if ($swap->requester_id === $employee->id) {
                 return response()->json(['message' => 'Cannot claim your own request'], 422);
            }
            
            // If specific recipient was set, only they can claim
            if ($swap->recipient_id && $swap->recipient_id !== $employee->id) {
                 return response()->json(['message' => 'Unauthorized'], 403);
            }

            if ($swap->status !== 'pending') {
                 return response()->json(['message' => 'Swap is no longer available'], 422);
            }
            
            // Lock it in for this user (Employee ID)
            $swap->update([
                'status' => 'accepted_by_peer', // Pending manager approval
                'recipient_id' => $employee->id
            ]);
            
            return response()->json($swap);
        }

        return response()->json(['message' => 'Invalid action'], 400);
    }
}

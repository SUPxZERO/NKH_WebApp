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
        $userId = $request->user()->id;
        $view = $request->query('view', 'all'); // 'my_requests', 'available', 'all'
        
        $query = ShiftSwap::with(['requester.user', 'shift.location', 'shift.position'])
            ->latest();

        if ($view === 'my_requests') {
            $query->where('requester_id', $userId);
        } elseif ($view === 'available') {
            $query->where('type', 'give_away')
                  ->where('status', 'pending')
                  ->where('requester_id', '!=', $userId)
                  ->where(function($q) use ($userId) {
                      $q->whereNull('recipient_id')
                        ->orWhere('recipient_id', $userId);
                  });
        } else {
             // Fallback: show everything relevant to me
             $query->where(function($q) use ($userId) {
                $q->where('requester_id', $userId)
                  ->orWhere('recipient_id', $userId)
                  ->orWhere(function($sub) use ($userId) {
                      $sub->whereNull('recipient_id')
                          ->where('type', 'give_away')
                          ->where('requester_id', '!=', $userId);
                  });
            });
        }
            
        return response()->json($query->get());
    }

    /**
     * Create a new swap request
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'shift_id' => 'required|exists:shifts,id',
            'type' => 'required|in:give_away,trade',
            'recipient_id' => 'nullable|exists:users,id',
            'reason' => 'nullable|string',
        ]);
        
        // Prevent duplicate active requests for same shift
        if (ShiftSwap::where('shift_id', $validated['shift_id'])
            ->whereIn('status', ['pending', 'accepted_by_peer'])
            ->exists()) {
             return response()->json(['message' => 'An active request already exists for this shift.'], 422);
        }

        $swap = ShiftSwap::create([
            'requester_id' => $request->user()->id,
            'shift_id' => $validated['shift_id'],
            'recipient_id' => $validated['recipient_id'] ?? null,
            'type' => $validated['type'],
            'status' => 'pending',
            'reason' => $validated['reason'] ?? null,
        ]);

        return response()->json($swap, 201);
    }
    
    /**
     * Interact with swap (cancel, claim/accept)
     */
    public function update(Request $request, $id)
    {
        $swap = ShiftSwap::findOrFail($id);
        $user = $request->user();
        $action = $request->input('action'); // 'cancel', 'claim'
        
        if ($action === 'cancel') {
            if ($swap->requester_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            $swap->update(['status' => 'cancelled']);
            return response()->json($swap);
        }
        
        if ($action === 'claim') {
            if ($swap->requester_id === $user->id) {
                 return response()->json(['message' => 'Cannot claim your own request'], 422);
            }
            
            // If specific recipient was set, only they can claim
            if ($swap->recipient_id && $swap->recipient_id !== $user->id) {
                 return response()->json(['message' => 'Unauthorized'], 403);
            }

            if ($swap->status !== 'pending') {
                 return response()->json(['message' => 'Swap is no longer available'], 422);
            }
            
            // Lock it in for this user
            $swap->update([
                'status' => 'accepted_by_peer', // Pending manager approval
                'recipient_id' => $user->id
            ]);
            
            return response()->json($swap);
        }

        return response()->json(['message' => 'Invalid action'], 400);
    }
}

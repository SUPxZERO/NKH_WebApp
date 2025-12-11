<?php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Models\ShiftSwap;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ShiftSwapController extends Controller
{
    /**
     * List all swaps available to me or created by me
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        
        $swaps = ShiftSwap::with(['requester', 'shift.location', 'shift.position'])
            ->where(function($q) use ($userId) {
                // My requests
                $q->where('requester_id', $userId);
                
                // OR incoming requests specific to me
                $q->orWhere('recipient_id', $userId);
                
                // OR open requests (give_away) where I am NOT the requester
                $q->orWhere(function($sub) use ($userId) {
                    $sub->whereNull('recipient_id')
                        ->where('type', 'give_away')
                        ->where('requester_id', '!=', $userId);
                });
            })
            ->latest()
            ->get();
            
        return response()->json($swaps);
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
            'recipient_id' => $validated['recipient_id'],
            'type' => $validated['type'],
            'status' => 'pending',
            'reason' => $validated['reason'],
        ]);

        return response()->json($swap, 201);
    }
    
    /**
     * Cancel or Interact with swap
     */
    public function update(Request $request, $id)
    {
        $swap = ShiftSwap::findOrFail($id);
        $user = $request->user();
        $action = $request->input('action'); // 'cancel', 'accept'
        
        if ($action === 'cancel') {
            if ($swap->requester_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            $swap->update(['status' => 'cancelled']);
            return response()->json($swap);
        }
        
        if ($action === 'accept') {
            // Logic for a peer accepting a giveaway
            // If it's a giveaway, peer accepting moves it to "accepted_by_peer" (waiting manager approval)
            // Or if auto-approve is on? Let's assume manager approval is always needed for now.
            
            if ($swap->requester_id === $user->id) {
                 return response()->json(['message' => 'Cannot accept your own request'], 422);
            }
            
            // If specific recipient, only they can accept
            if ($swap->recipient_id && $swap->recipient_id !== $user->id) {
                 return response()->json(['message' => 'Unauthorized'], 403);
            }
            
            // Lock it in for this user
            $swap->update([
                'status' => 'accepted_by_peer',
                'recipient_id' => $user->id // If it was null (open), now it's claimed by this user
            ]);
            
            return response()->json($swap);
        }

        return response()->json(['message' => 'Invalid action'], 400);
    }
}

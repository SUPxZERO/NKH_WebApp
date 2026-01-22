<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShiftSwap;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ShiftSwapApprovalController extends Controller
{
    /**
     * List all pending shift swap approvals
     */
    public function index(Request $request)
    {
        $swaps = ShiftSwap::with([
                'requester.user',
                'recipient.user',
                'shift.location',
                'shift.position'
            ])
            ->where('status', 'accepted_by_peer')
            ->latest()
            ->get();

        return response()->json(['data' => $swaps]);
    }

    /**
     * Approve a shift swap request
     */
    public function approve(Request $request, $id)
    {
        $swap = ShiftSwap::findOrFail($id);
        $user = $request->user();

        // Verify swap is in the correct status
        if ($swap->status !== 'accepted_by_peer') {
            return response()->json([
                'message' => 'Only swaps that have been accepted by a peer can be approved.'
            ], 422);
        }

        // Verify recipient exists (someone claimed it)
        if (!$swap->recipient_id) {
            return response()->json([
                'message' => 'No one has claimed this swap yet.'
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Update swap status
            $swap->update([
                'status' => 'approved',
                'approved_by' => $user->id,
                'approved_at' => now(),
            ]);

            // Here you could also update the actual shift assignment
            // For example, reassign the shift to the recipient
            // $swap->shift->update(['employee_id' => $swap->recipient_id]);

            DB::commit();

            return response()->json([
                'message' => 'Shift swap approved successfully.',
                'data' => $swap->load(['requester.user', 'recipient.user', 'shift.location', 'shift.position'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to approve shift swap.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Deny a shift swap request
     */
    public function deny(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:500'
        ]);

        $swap = ShiftSwap::findOrFail($id);
        $user = $request->user();

        // Verify swap is in a status that can be denied
        if (!in_array($swap->status, ['pending', 'accepted_by_peer'])) {
            return response()->json([
                'message' => 'This swap cannot be denied in its current status.'
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Update swap status
            $swap->update([
                'status' => 'denied',
                'approved_by' => $user->id,
                'approved_at' => now(),
                'denial_reason' => $validated['reason'] ?? null,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Shift swap denied.',
                'data' => $swap->load(['requester.user', 'recipient.user', 'shift.location', 'shift.position'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to deny shift swap.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

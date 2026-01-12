<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse; // FIX: Phase 4
use App\Models\InventoryAdjustment;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Models\Ingredient;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class InventoryAdjustmentController extends Controller
{
    use ApiResponse; // FIX: Phase 4 - Standardized responses

    public function index(Request $request): JsonResponse
    {
        $query = InventoryAdjustment::with(['ingredient.unit', 'location', 'adjustedBy', 'adjusted_by_employee']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('ingredient', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('reason') && $request->reason !== 'all') {
            $query->where('reason', $request->reason);
        }

        $adjustments = $query->orderBy('created_at', 'desc')->paginate($request->integer('per_page', 12));

        return response()->json($adjustments);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ingredient_id' => 'required|exists:ingredients,id',
            'location_id' => 'required|exists:locations,id',
            'quantity_before' => 'required|numeric',
            'quantity_after' => 'required|numeric',
            'quantity_change' => 'required|numeric',
            'reason' => 'required|string',
            'notes' => 'nullable|string',
            'adjusted_by' => 'required|exists:users,id'
        ]);

        $validated['status'] = 'pending';
        $adjustment = InventoryAdjustment::create($validated);

        return response()->json($adjustment, 201);
    }

    public function show(InventoryAdjustment $inventoryAdjustment): JsonResponse
    {
        return response()->json($inventoryAdjustment->load(['ingredient', 'location', 'adjustedBy', 'approvedBy']));
    }

    public function approve(Request $request, InventoryAdjustment $adjustment): JsonResponse
    {
        // Treat null as pending for backward compatibility
        $currentStatus = strtolower($adjustment->status ?? 'pending');
        
        if ($currentStatus !== 'pending') {
            return response()->json([
                'message' => 'Adjustment is not pending',
                'current_status' => $adjustment->status
            ], 422);
        }

        $validated = $request->validate([
            'approval_notes' => 'nullable|string'
        ]);

        // Enforce authentication
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $user = auth()->user();
        $approvedBy = $user->id;

        // Prevent self-approval (Fraud Prevention)
        if ($adjustment->adjusted_by === $approvedBy) {
            // Allow Super Admin to bypass (optional, but safer to enforce "four-eyes principle")
            // For now, strict enforcement:
            return response()->json(['message' => 'Self-approval is not allowed. Another manager must approve this.'], 403);
        }

        if (!$adjustment->location_id || !$adjustment->ingredient_id) {
            return response()->json(['message' => 'Adjustment record is incomplete (missing location or ingredient)'], 422);
        }

        DB::transaction(function () use ($adjustment, $validated, $approvedBy) {
            $adjustment->update([
                'status' => 'approved',
                'approved_by' => $approvedBy,
                'approved_at' => now(),
                'approval_notes' => $validated['approval_notes'] ?? null
            ]);

            // Apply the adjustment to inventory
            $inventory = Inventory::firstOrCreate(
                [
                    'location_id' => $adjustment->location_id,
                    'ingredient_id' => $adjustment->ingredient_id
                ],
                ['quantity' => 0]
            );

            $inventory->increment('quantity', $adjustment->quantity_change);

            // Record transaction
            InventoryTransaction::create([
                'location_id' => $adjustment->location_id,
                'ingredient_id' => $adjustment->ingredient_id,
                'type' => 'adjustment',
                'movement_type' => 'adjustment',
                'quantity' => $adjustment->quantity_change,
                'notes' => "Adjustment approved. Reason: {$adjustment->reason}",
                'transacted_at' => now(),
                'created_by' => $approvedBy,
                'user_id' => $approvedBy
            ]);
            
            // Update ingredient total stock
            $ingredient = Ingredient::find($adjustment->ingredient_id);
            $ingredient->increment('current_stock', $adjustment->quantity_change);
        });

        return response()->json(['message' => 'Adjustment approved']);
    }

    public function reject(Request $request, InventoryAdjustment $adjustment): JsonResponse
    {
        // Treat null as pending
        $currentStatus = strtolower($adjustment->status ?? 'pending');

        if ($currentStatus !== 'pending') {
            return response()->json([
                'message' => 'Adjustment is not pending',
                'current_status' => $adjustment->status
            ], 422);
        }

        $validated = $request->validate([
            'rejection_reason' => 'nullable|string'
        ]);

        // Use authenticated user ID, default to 1 if not authenticated
        $rejectedBy = auth()->id() ?? 1;

        $adjustment->update([
            'status' => 'rejected',
            'rejected_by' => $rejectedBy,
            'rejected_at' => now(),
            'rejection_reason' => $validated['rejection_reason'] ?? null
        ]);

        return response()->json(['message' => 'Adjustment rejected']);
    }

    public function stats(): JsonResponse
    {
        $pending = InventoryAdjustment::where('status', 'pending')->count();
        $approved = InventoryAdjustment::where('status', 'approved')->count();
        $thisMonth = InventoryAdjustment::whereMonth('created_at', now()->month)->count();

        return response()->json([
            'pending' => $pending,
            'approved' => $approved,
            'this_month' => $thisMonth
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryAdjustment;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Models\Ingredient;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class InventoryAdjustmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = InventoryAdjustment::with(['ingredient', 'location', 'adjustedBy']);

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

        $adjustment = InventoryAdjustment::create($validated);

        return response()->json($adjustment, 201);
    }

    public function show(InventoryAdjustment $inventoryAdjustment): JsonResponse
    {
        return response()->json($inventoryAdjustment->load(['ingredient', 'location', 'adjustedBy', 'approvedBy']));
    }

    public function approve(Request $request, InventoryAdjustment $inventoryAdjustment): JsonResponse
    {
        if ($inventoryAdjustment->status !== 'pending') {
            return response()->json(['message' => 'Adjustment is not pending'], 422);
        }

        $validated = $request->validate([
            'approved_by' => 'required|exists:users,id',
            'approval_notes' => 'nullable|string'
        ]);

        DB::transaction(function () use ($inventoryAdjustment, $validated) {
            $inventoryAdjustment->update([
                'status' => 'approved',
                'approved_by' => $validated['approved_by'],
                'approval_notes' => $validated['approval_notes']
            ]);

            // Apply the adjustment to inventory
            $inventory = Inventory::firstOrCreate(
                [
                    'location_id' => $inventoryAdjustment->location_id,
                    'ingredient_id' => $inventoryAdjustment->ingredient_id
                ],
                ['quantity' => 0]
            );

            // We set the quantity to quantity_after (absolute adjustment)
            // Or we apply the change?
            // Since it's an adjustment based on a count, we should probably set it to quantity_after.
            // But if inventory changed since the count?
            // Usually adjustments are "add/subtract".
            // But here we have before/after.
            // Let's apply the change.
            
            $inventory->increment('quantity', $inventoryAdjustment->quantity_change);

            // Record transaction
            InventoryTransaction::create([
                'location_id' => $inventoryAdjustment->location_id,
                'ingredient_id' => $inventoryAdjustment->ingredient_id,
                'type' => 'adjustment',
                'quantity' => $inventoryAdjustment->quantity_change,
                'notes' => "Adjustment approved. Reason: {$inventoryAdjustment->reason}",
                'transacted_at' => now(),
                'created_by' => $validated['approved_by']
            ]);
            
            // Update ingredient total stock
            $ingredient = Ingredient::find($inventoryAdjustment->ingredient_id);
            $ingredient->increment('current_stock', $inventoryAdjustment->quantity_change);
        });

        return response()->json(['message' => 'Adjustment approved']);
    }

    public function reject(Request $request, InventoryAdjustment $inventoryAdjustment): JsonResponse
    {
        if ($inventoryAdjustment->status !== 'pending') {
            return response()->json(['message' => 'Adjustment is not pending'], 422);
        }

        $validated = $request->validate([
            'approved_by' => 'required|exists:users,id',
            'approval_notes' => 'required|string'
        ]);

        $inventoryAdjustment->update([
            'status' => 'rejected',
            'approved_by' => $validated['approved_by'],
            'approval_notes' => $validated['approval_notes']
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

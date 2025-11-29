<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Models\Ingredient;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Inventory::with(['ingredient.unit', 'location']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('ingredient', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('location_id') && $request->location_id !== 'all') {
            $query->where('location_id', $request->location_id);
        }

        if ($request->boolean('low_stock')) {
            // This is tricky because low stock is defined on ingredient, but inventory is per location.
            // We'll check if quantity <= ingredient.reorder_point (simplified)
            // Or we can just filter where quantity is low.
            $query->where('quantity', '<=', 10); // Placeholder logic
        }

        if ($request->boolean('expiring_soon')) {
            $query->where('expiration_date', '<=', now()->addDays(7));
        }

        $inventory = $query->paginate($request->integer('per_page', 12));

        return response()->json($inventory);
    }

    public function show(Ingredient $ingredient): JsonResponse
    {
        $inventory = Inventory::with('location')
            ->where('ingredient_id', $ingredient->id)
            ->get();
        
        return response()->json($inventory);
    }

    public function transfer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from_location_id' => 'required|exists:locations,id',
            'to_location_id' => 'required|exists:locations,id|different:from_location_id',
            'ingredient_id' => 'required|exists:ingredients,id',
            'quantity' => 'required|numeric|min:0.001',
            'notes' => 'nullable|string'
        ]);

        DB::transaction(function () use ($validated) {
            // Decrease from source
            $source = Inventory::where('location_id', $validated['from_location_id'])
                ->where('ingredient_id', $validated['ingredient_id'])
                ->firstOrFail();

            if ($source->quantity < $validated['quantity']) {
                throw new \Exception('Insufficient stock at source location');
            }

            $source->decrement('quantity', $validated['quantity']);

            // Increase at destination
            $dest = Inventory::firstOrCreate(
                [
                    'location_id' => $validated['to_location_id'],
                    'ingredient_id' => $validated['ingredient_id']
                ],
                ['quantity' => 0]
            );

            $dest->increment('quantity', $validated['quantity']);

            // Record transaction
            InventoryTransaction::create([
                'location_id' => $validated['from_location_id'],
                'ingredient_id' => $validated['ingredient_id'],
                'type' => 'transfer_out',
                'quantity' => -$validated['quantity'],
                'notes' => "Transfer to location #{$validated['to_location_id']}. " . ($validated['notes'] ?? ''),
                'transacted_at' => now(),
                'created_by' => auth()->id() ?? 1
            ]);

            InventoryTransaction::create([
                'location_id' => $validated['to_location_id'],
                'ingredient_id' => $validated['ingredient_id'],
                'type' => 'transfer_in',
                'quantity' => $validated['quantity'],
                'notes' => "Transfer from location #{$validated['from_location_id']}. " . ($validated['notes'] ?? ''),
                'transacted_at' => now(),
                'created_by' => auth()->id() ?? 1
            ]);
        });

        return response()->json(['message' => 'Transfer successful']);
    }

    public function recordWastage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'location_id' => 'required|exists:locations,id',
            'ingredient_id' => 'required|exists:ingredients,id',
            'quantity' => 'required|numeric|min:0.001',
            'reason' => 'required|string',
            'notes' => 'nullable|string'
        ]);

        DB::transaction(function () use ($validated) {
            $inventory = Inventory::where('location_id', $validated['location_id'])
                ->where('ingredient_id', $validated['ingredient_id'])
                ->firstOrFail();

            if ($inventory->quantity < $validated['quantity']) {
                throw new \Exception('Insufficient stock to record wastage');
            }

            $inventory->decrement('quantity', $validated['quantity']);

            InventoryTransaction::create([
                'location_id' => $validated['location_id'],
                'ingredient_id' => $validated['ingredient_id'],
                'type' => 'wastage',
                'quantity' => -$validated['quantity'],
                'notes' => "Reason: {$validated['reason']}. " . ($validated['notes'] ?? ''),
                'transacted_at' => now(),
                'created_by' => auth()->id() ?? 1
            ]);
            
            // Also update ingredient total stock
            $ingredient = Ingredient::find($validated['ingredient_id']);
            $ingredient->decrement('current_stock', $validated['quantity']);
        });

        return response()->json(['message' => 'Wastage recorded']);
    }

    public function movements(Ingredient $ingredient): JsonResponse
    {
        $movements = InventoryTransaction::with(['location', 'creator'])
            ->where('ingredient_id', $ingredient->id)
            ->orderBy('transacted_at', 'desc')
            ->paginate(20);

        return response()->json($movements);
    }

    public function valuation(): JsonResponse
    {
        // Calculate total value based on inventory quantity * ingredient cost
        // This is complex query
        $totalValue = DB::table('inventory')
            ->join('ingredients', 'inventory.ingredient_id', '=', 'ingredients.id')
            ->sum(DB::raw('inventory.quantity * ingredients.cost_per_unit'));

        return response()->json(['total_value' => $totalValue]);
    }

    public function stats(): JsonResponse
    {
        $totalValue = DB::table('inventory')
            ->join('ingredients', 'inventory.ingredient_id', '=', 'ingredients.id')
            ->sum(DB::raw('inventory.quantity * ingredients.cost_per_unit'));

        $lowStockCount = Inventory::where('quantity', '<=', 10)->count(); // Simplified
        
        $expiringSoon = Inventory::where('expiration_date', '<=', now()->addDays(7))
            ->where('expiration_date', '>=', now())
            ->count();

        return response()->json([
            'total_value' => $totalValue,
            'low_stock_count' => $lowStockCount,
            'expiring_soon' => $expiringSoon
        ]);
    }
}

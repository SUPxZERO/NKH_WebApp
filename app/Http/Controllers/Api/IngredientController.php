<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ingredient;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class IngredientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Ingredient::with(['unit', 'supplier']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->filled('supplier_id') && $request->supplier_id !== 'all') {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        $ingredients = $query->orderBy('name')->paginate($request->integer('per_page', 12));

        return response()->json($ingredients);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:ingredients,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string',
            'unit_id' => 'required|exists:units,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'cost_per_unit' => 'required|numeric|min:0',
            'min_stock_level' => 'nullable|numeric|min:0',
            'max_stock_level' => 'nullable|numeric|min:0',
            'reorder_point' => 'nullable|numeric|min:0',
            'storage_requirements' => 'nullable|string',
            'allergens' => 'nullable|string',
            'shelf_life_days' => 'nullable|integer|min:0',
            'is_active' => 'boolean'
        ]);

        $ingredient = Ingredient::create($validated);

        return response()->json($ingredient, 201);
    }

    public function show(Ingredient $ingredient): JsonResponse
    {
        return response()->json($ingredient->load(['unit', 'supplier']));
    }

    public function update(Request $request, Ingredient $ingredient): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:ingredients,code,' . $ingredient->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string',
            'unit_id' => 'required|exists:units,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'cost_per_unit' => 'required|numeric|min:0',
            'min_stock_level' => 'nullable|numeric|min:0',
            'max_stock_level' => 'nullable|numeric|min:0',
            'reorder_point' => 'nullable|numeric|min:0',
            'storage_requirements' => 'nullable|string',
            'allergens' => 'nullable|string',
            'shelf_life_days' => 'nullable|integer|min:0',
            'is_active' => 'boolean'
        ]);

        $ingredient->update($validated);

        return response()->json($ingredient);
    }

    public function destroy(Ingredient $ingredient): JsonResponse
    {
        // Check dependencies
        if ($ingredient->recipeIngredients()->exists()) {
            return response()->json(['message' => 'Cannot delete ingredient used in recipes'], 422);
        }

        if ($ingredient->current_stock > 0) {
            return response()->json(['message' => 'Cannot delete ingredient with existing stock'], 422);
        }

        $ingredient->delete();

        return response()->json(['message' => 'Ingredient deleted successfully']);
    }

    public function stats(): JsonResponse
    {
        $totalIngredients = Ingredient::count();
        $lowStock = Ingredient::whereRaw('current_stock <= reorder_point')->count();
        $totalValue = Ingredient::sum(DB::raw('current_stock * cost_per_unit'));

        return response()->json([
            'total_ingredients' => $totalIngredients,
            'low_stock' => $lowStock,
            'total_inventory_value' => $totalValue ?? 0
        ]);
    }

    public function categories(): JsonResponse
    {
        $categories = [
            'protein' => 'Protein',
            'vegetable' => 'Vegetables',
            'fruit' => 'Fruits',
            'dairy' => 'Dairy',
            'grain' => 'Grains',
            'spice' => 'Spices',
            'oil' => 'Oils',
            'beverage' => 'Beverages',
            'other' => 'Other'
        ];
        return response()->json($categories);
    }

    public function lowStock(): JsonResponse
    {
        $ingredients = Ingredient::with(['unit', 'supplier'])
            ->whereRaw('current_stock <= reorder_point')
            ->orderBy('current_stock')
            ->limit(10)
            ->get();

        return response()->json($ingredients);
    }

    public function costHistory(Ingredient $ingredient): JsonResponse
    {
        // Placeholder for cost history - would typically query a price history table
        // For now returning current cost as a single point
        return response()->json([
            [
                'date' => now()->toDateString(),
                'cost' => $ingredient->cost_per_unit
            ]
        ]);
    }
}

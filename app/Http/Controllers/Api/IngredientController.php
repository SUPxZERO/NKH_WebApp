<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ingredient;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class IngredientController extends Controller
{
    // GET /api/admin/ingredients
    public function index(Request $request)
    {
        $query = Ingredient::query();

        if ($request->filled('search')) {
            $s = $request->string('search');
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('sku', 'like', "%{$s}%");
            });
        }

        // Status filter: active/inactive/low_stock
        if ($request->filled('is_active')) {
            $query->where('is_active', (int) $request->is_active);
        }
        if ($request->string('status') === 'low_stock' || $request->boolean('low_stock')) {
            $query->whereColumn('quantity_on_hand', '<=', 'reorder_level');
        }

        return $query->orderBy('id', 'desc')
                     ->paginate($request->integer('per_page', 12));
    }

    public function store(Request $request): Ingredient
    {
        $data = $request->validate([
            'location_id' => ['nullable', 'integer'],
            'sku' => ['nullable', 'string', 'max:120'],
            'name' => ['required', 'string', 'max:200'],
            'unit' => ['required', 'string', 'max:20'],
            'quantity_on_hand' => ['nullable', 'numeric', 'min:0'],
            'reorder_level' => ['nullable', 'numeric', 'min:0'],
            'reorder_quantity' => ['nullable', 'numeric', 'min:0'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $ingredient = Ingredient::create([
            'location_id' => $data['location_id'] ?? null,
            'sku' => $data['sku'] ?? null,
            'name' => $data['name'],
            'unit' => $data['unit'],
            'quantity_on_hand' => $data['quantity_on_hand'] ?? 0,
            'reorder_level' => $data['reorder_level'] ?? 0,
            'reorder_quantity' => $data['reorder_quantity'] ?? null,
            'cost' => $data['cost'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return $ingredient;
    }

    public function show(Ingredient $ingredient): Ingredient
    {
        return $ingredient;
    }

    public function update(Request $request, Ingredient $ingredient): Ingredient
    {
        $data = $request->validate([
            'location_id' => ['nullable', 'integer'],
            'sku' => ['nullable', 'string', 'max:120'],
            'name' => ['sometimes', 'string', 'max:200'],
            'unit' => ['sometimes', 'string', 'max:20'],
            'quantity_on_hand' => ['nullable', 'numeric', 'min:0'],
            'reorder_level' => ['nullable', 'numeric', 'min:0'],
            'reorder_quantity' => ['nullable', 'numeric', 'min:0'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $ingredient->update($data);
        return $ingredient->fresh();
    }

    public function destroy(Ingredient $ingredient): JsonResponse
    {
        $ingredient->delete();
        return response()->json(['message' => 'Ingredient deleted successfully.']);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UnitController extends Controller
{
    /**
     * Display a listing of units
     */
    public function index(Request $request): JsonResponse
    {
        $query = Unit::query();

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('display_name', 'like', "%{$search}%");
            });
        }

        // Filter by base unit
        if ($request->has('is_base_unit')) {
            $query->where('is_base_unit', $request->is_base_unit);
        }

        // Filter by type
        if ($request->has('for_weight') && $request->for_weight) {
            $query->where('for_weight', true);
        }
        if ($request->has('for_volume') && $request->for_volume) {
            $query->where('for_volume', true);
        }
        if ($request->has('for_quantity') && $request->for_quantity) {
            $query->where('for_quantity', true);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->get('per_page', 15);
        $units = $query->paginate($perPage);

        return response()->json($units);
    }

    /**
     * Store a newly created unit
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:10|unique:units,code',
            'name' => 'required|string|max:50',
            'display_name' => 'required|string|max:20',
            'base_unit' => 'nullable|exists:units,code',
            'conversion_factor' => 'nullable|numeric|min:0',
            'is_base_unit' => 'boolean',
            'for_weight' => 'boolean',
            'for_volume' => 'boolean',
            'for_quantity' => 'boolean',
            'for_packaging' => 'boolean',
            'for_produce' => 'boolean'
        ]);

        // If marked as base unit, ensure no base_unit or conversion_factor
        if ($validated['is_base_unit'] ?? false) {
            $validated['base_unit'] = null;
            $validated['conversion_factor'] = null;
        }

        $unit = Unit::create($validated);

        return response()->json([
            'message' => 'Unit created successfully',
            'data' => $unit
        ], 201);
    }

    /**
     * Display the specified unit
     */
    public function show(Unit $unit): JsonResponse
    {
        return response()->json([
            'data' => $unit
        ]);
    }

    /**
     * Update the specified unit
     */
    public function update(Request $request, Unit $unit): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:10|unique:units,code,' . $unit->id,
            'name' => 'required|string|max:50',
            'display_name' => 'required|string|max:20',
            'base_unit' => 'nullable|exists:units,code',
            'conversion_factor' => 'nullable|numeric|min:0',
            'is_base_unit' => 'boolean',
            'for_weight' => 'boolean',
            'for_volume' => 'boolean',
            'for_quantity' => 'boolean',
            'for_packaging' => 'boolean',
            'for_produce' => 'boolean'
        ]);

        // If marked as base unit, remove base_unit and conversion_factor
        if ($validated['is_base_unit'] ?? false) {
            $validated['base_unit'] = null;
            $validated['conversion_factor'] = null;
        }

        $unit->update($validated);

        return response()->json([
            'message' => 'Unit updated successfully',
            'data' => $unit
        ]);
    }

    /**
     * Remove the specified unit
     */
    public function destroy(Unit $unit): JsonResponse
    {
        // Check if unit is being used
        $inUseCheck = \DB::table('ingredients')
            ->where('unit', $unit->code)
            ->exists();

        if ($inUseCheck) {
            return response()->json([
                'message' => 'Cannot delete unit that is in use by ingredients'
            ], 422);
        }

        $unit->delete();

        return response()->json([
            'message' => 'Unit deleted successfully'
        ]);
    }

    /**
     * Get list of base units
     */
    public function baseUnits(): JsonResponse
    {
        $baseUnits = Unit::where('is_base_unit', true)
            ->orderBy('name')
            ->get();

        return response()->json($baseUnits);
    }
}

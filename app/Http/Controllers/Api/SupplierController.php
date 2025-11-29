<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SupplierController extends Controller
{
    /**
     * Display a listing of suppliers
     */
    public function index(Request $request): JsonResponse
    {
        $query = Supplier::with('location');

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('contact_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        // Filter by location
        if ($request->has('location_id') && $request->location_id !== 'all') {
            $query->where('location_id', $request->location_id);
        }

        // Filter by type
        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->get('per_page', 15);
        $suppliers = $query->paginate($perPage);

        return response()->json($suppliers);
    }

    /**
     * Store a newly created supplier
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'location_id' => 'nullable|exists:locations,id',
            'code' => 'required|string|max:50|unique:suppliers,code',
            'name' => 'required|string|max:150',
            'contact_name' => 'nullable|string|max:100',
            'contact_phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
            'type' => 'required|string|max:50',
            'payment_terms' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
            'tax_id' => 'nullable|string|max:50',
            'is_active' => 'boolean'
        ]);

        $supplier = Supplier::create($validated);
        $supplier->load('location');

        return response()->json([
            'message' => 'Supplier created successfully',
            'data' => $supplier
        ], 201);
    }

    /**
     * Display the specified supplier
     */
    public function show(Supplier $supplier): JsonResponse
    {
        $supplier->load(['location', 'purchaseOrders']);
        
        return response()->json([
            'data' => $supplier
        ]);
    }

    /**
     * Update the specified supplier
     */
    public function update(Request $request, Supplier $supplier): JsonResponse
    {
        $validated = $request->validate([
            'location_id' => 'nullable|exists:locations,id',
            'code' => 'required|string|max:50|unique:suppliers,code,' . $supplier->id,
            'name' => 'required|string|max:150',
            'contact_name' => 'nullable|string|max:100',
            'contact_phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
            'type' => 'required|string|max:50',
            'payment_terms' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
            'tax_id' => 'nullable|string|max:50',
            'is_active' => 'boolean'
        ]);

        $supplier->update($validated);
        $supplier->load('location');

        return response()->json([
            'message' => 'Supplier updated successfully',
            'data' => $supplier
        ]);
    }

    /**
     * Remove the specified supplier
     */
    public function destroy(Supplier $supplier): JsonResponse
    {
        // Check if supplier has purchase orders
        if ($supplier->purchaseOrders()->exists()) {
            return response()->json([
                'message' => 'Cannot delete supplier with existing purchase orders. Please archive it instead.'
            ], 422);
        }

        $supplier->delete();

        return response()->json([
            'message' => 'Supplier deleted successfully'
        ]);
    }

    /**
     * Get supplier types
     */
    public function types(): JsonResponse
    {
        // Common supplier types for restaurants
        $types = [
            'food_produce' => 'Food & Produce',
            'beverages' => 'Beverages',
            'meat_seafood' => 'Meat & Seafood',
            'dairy' => 'Dairy Products',
            'equipment' => 'Equipment',
            'supplies' => 'Supplies & Packaging',
            'cleaning' => 'Cleaning Products',
            'utilities' => 'Utilities',
            'services' => 'Services',
            'other' => 'Other'
        ];

        return response()->json($types);
    }
}

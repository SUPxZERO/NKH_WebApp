<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PurchaseOrderController extends Controller
{
    /**
     * Display a listing of purchase orders
     */
    public function index(Request $request): JsonResponse
    {
        $query = PurchaseOrder::with(['supplier', 'location', 'items']);

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('po_number', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%")
                  ->orWhereHas('supplier', function ($sq) use ($search) {
                      $sq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by supplier
        if ($request->has('supplier_id') && $request->supplier_id !== 'all') {
            $query->where('supplier_id', $request->supplier_id);
        }

        // Filter by location
        if ($request->has('location_id') && $request->location_id !== 'all') {
            $query->where('location_id', $request->location_id);
        }

        // Filter by date range
        if ($request->has('date_from')) {
            $query->where('order_date', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->where('order_date', '<=', $request->date_to);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'order_date');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->get('per_page', 15);
        $purchaseOrders = $query->paginate($perPage);

        return response()->json($purchaseOrders);
    }

    /**
     * Store a newly created purchase order
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'location_id' => 'nullable|exists:locations,id',
            'order_date' => 'required|date',
            'expected_delivery_date' => 'nullable|date',
            'status' => 'nullable|in:draft,pending,approved,ordered,partially_received,received,cancelled',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.ingredient_id' => 'required|exists:ingredients,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.notes' => 'nullable|string'
        ]);

        DB::beginTransaction();
        try {
            // Generate PO number
            $poNumber = $this->generatePONumber();

            // Calculate total
            $total = collect($validated['items'])->sum(function ($item) {
                return $item['quantity'] * $item['unit_price'];
            });

            // Create purchase order
            $purchaseOrder = PurchaseOrder::create([
                'supplier_id' => $validated['supplier_id'],
                'location_id' => $validated['location_id'] ?? null,
                'po_number' => $poNumber,
                'order_date' => $validated['order_date'],
                'expected_delivery_date' => $validated['expected_delivery_date'] ?? null,
                'status' => $validated['status'] ?? 'draft',
                'total_amount' => $total,
                'notes' => $validated['notes'] ?? null
            ]);

            // Create purchase order items
            foreach ($validated['items'] as $item) {
                PurchaseOrderItem::create([
                    'purchase_order_id' => $purchaseOrder->id,
                    'ingredient_id' => $item['ingredient_id'],
                    'quantity_ordered' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'quantity_received' => 0,
                    'notes' => $item['notes'] ?? null
                ]);
            }

            $purchaseOrder->load(['supplier', 'location', 'items.ingredient']);

            DB::commit();

            return response()->json([
                'message' => 'Purchase order created successfully',
                'data' => $purchaseOrder
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create purchase order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified purchase order
     */
    public function show(PurchaseOrder $purchaseOrder): JsonResponse
    {
        $purchaseOrder->load(['supplier', 'location', 'items.ingredient.unit']);
        
        return response()->json([
            'data' => $purchaseOrder
        ]);
    }

    /**
     * Update the specified purchase order
     */
    public function update(Request $request, PurchaseOrder $purchaseOrder): JsonResponse
    {
        // Prevent editing if already received or cancelled
        if (in_array($purchaseOrder->status, ['received', 'cancelled'])) {
            return response()->json([
                'message' => 'Cannot edit purchase orders with status: ' . $purchaseOrder->status
            ], 422);
        }

        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'location_id' => 'nullable|exists:locations,id',
            'order_date' => 'required|date',
            'expected_delivery_date' => 'nullable|date',
            'status' => 'nullable|in:draft,pending,approved,ordered,partially_received,received,cancelled',
            'notes' => 'nullable|string',
            'items' => 'sometimes|array|min:1',
            'items.*.id' => 'nullable|exists:purchase_order_items,id',
            'items.*.ingredient_id' => 'required|exists:ingredients,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.notes' => 'nullable|string'
        ]);

        DB::beginTransaction();
        try {
            // Update purchase order
            $purchaseOrder->update([
                'supplier_id' => $validated['supplier_id'],
                'location_id' => $validated['location_id'] ?? null,
                'order_date' => $validated['order_date'],
                'expected_delivery_date' => $validated['expected_delivery_date'] ?? null,
                'status' => $validated['status'] ?? $purchaseOrder->status,
                'notes' => $validated['notes'] ?? null
            ]);

            // Update items if provided
            if (isset($validated['items'])) {
                // Delete existing items not in the update
                $itemIds = collect($validated['items'])->pluck('id')->filter();
                $purchaseOrder->items()->whereNotIn('id', $itemIds)->delete();

                // Update or create items
                $total = 0;
                foreach ($validated['items'] as $item) {
                    $itemTotal = $item['quantity'] * $item['unit_price'];
                    $total += $itemTotal;

                    if (isset($item['id'])) {
                        PurchaseOrderItem::where('id', $item['id'])->update([
                            'ingredient_id' => $item['ingredient_id'],
                            'quantity_ordered' => $item['quantity'],
                            'unit_price' => $item['unit_price'],
                            'notes' => $item['notes'] ?? null
                        ]);
                    } else {
                        PurchaseOrderItem::create([
                            'purchase_order_id' => $purchaseOrder->id,
                            'ingredient_id' => $item['ingredient_id'],
                            'quantity_ordered' => $item['quantity'],
                            'unit_price' => $item['unit_price'],
                            'quantity_received' => 0,
                            'notes' => $item['notes'] ?? null
                        ]);
                    }
                }

                $purchaseOrder->update(['total_amount' => $total]);
            }

            $purchaseOrder->load(['supplier', 'location', 'items.ingredient']);

            DB::commit();

            return response()->json([
                'message' => 'Purchase order updated successfully',
                'data' => $purchaseOrder
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update purchase order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified purchase order
     */
    public function destroy(PurchaseOrder $purchaseOrder): JsonResponse
    {
        // Only allow deletion of draft or cancelled orders
        if (!in_array($purchaseOrder->status, ['draft', 'cancelled'])) {
            return response()->json([
                'message' => 'Can only delete draft or cancelled purchase orders'
            ], 422);
        }

        $purchaseOrder->items()->delete();
        $purchaseOrder->delete();

        return response()->json([
            'message' => 'Purchase order deleted successfully'
        ]);
    }

    /**
     * Approve a purchase order
     */
    public function approve(PurchaseOrder $purchaseOrder): JsonResponse
    {
        if ($purchaseOrder->status !== 'pending') {
            return response()->json([
                'message' => 'Can only approve pending purchase orders'
            ], 422);
        }

        $purchaseOrder->update(['status' => 'approved']);

        return response()->json([
            'message' => 'Purchase order approved successfully',
            'data' => $purchaseOrder
        ]);
    }

    /**
     * Mark purchase order as ordered
     */
    public function markOrdered(PurchaseOrder $purchaseOrder): JsonResponse
    {
        if (!in_array($purchaseOrder->status, ['approved', 'pending'])) {
            return response()->json([
                'message' => 'Can only mark approved or pending orders as ordered'
            ], 422);
        }

        $purchaseOrder->update(['status' => 'ordered']);

        return response()->json([
            'message' => 'Purchase order marked as ordered',
            'data' => $purchaseOrder
        ]);
    }

    /**
     * Receive items for a purchase order
     */
    public function receive(Request $request, PurchaseOrder $purchaseOrder): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:purchase_order_items,id',
            'items.*.quantity_received' => 'required|numeric|min:0'
        ]);

        DB::beginTransaction();
        try {
            foreach ($validated['items'] as $item) {
                $poItem = PurchaseOrderItem::find($item['item_id']);
                $newReceived = $poItem->quantity_received + $item['quantity_received'];

                $poItem->update([
                    'quantity_received' => $newReceived
                ]);
            }

            // Update PO status based on received quantities
            $allItems = $purchaseOrder->items;
            $allReceived = $allItems->every(function ($item) {
                return $item->quantity_received >= $item->quantity_ordered;
            });
            $anyReceived = $allItems->some(function ($item) {
                return $item->quantity_received > 0;
            });

            if ($allReceived) {
                $purchaseOrder->update(['status' => 'received', 'received_date' => now()]);
            } elseif ($anyReceived) {
                $purchaseOrder->update(['status' => 'partially_received']);
            }

            $purchaseOrder->load(['items.ingredient']);

            DB::commit();

            return response()->json([
                'message' => 'Items received successfully',
                'data' => $purchaseOrder
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to receive items',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel a purchase order
     */
    public function cancel(PurchaseOrder $purchaseOrder): JsonResponse
    {
        if (in_array($purchaseOrder->status, ['received', 'cancelled'])) {
            return response()->json([
                'message' => 'Cannot cancel received or already cancelled orders'
            ], 422);
        }

        $purchaseOrder->update(['status' => 'cancelled']);

        return response()->json([
            'message' => 'Purchase order cancelled successfully',
            'data' => $purchaseOrder
        ]);
    }

    /**
     * Get purchase order statistics
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total' => PurchaseOrder::count(),
            'by_status' => PurchaseOrder::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status'),
            'pending_approval' => PurchaseOrder::where('status', 'pending')->count(),
            'pending_receipt' => PurchaseOrder::whereIn('status', ['ordered', 'partially_received'])->count(),
            'total_value' => PurchaseOrder::where('status', '!=', 'cancelled')->sum('total_amount'),
            'this_month' => PurchaseOrder::whereMonth('order_date', now()->month)
                ->whereYear('order_date', now()->year)
                ->count()
        ];

        return response()->json($stats);
    }

    /**
     * Generate unique PO number
     */
    private function generatePONumber(): string
    {
        $prefix = 'PO';
        $date = now()->format('Ymd');
        $lastPO = PurchaseOrder::where('po_number', 'like', "{$prefix}-{$date}-%")
            ->orderBy('po_number', 'desc')
            ->first();

        if ($lastPO) {
            $lastNumber = intval(substr($lastPO->po_number, -4));
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }

        return "{$prefix}-{$date}-{$newNumber}";
    }
}

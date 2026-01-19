<?php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\DiningTable;
use App\Models\Employee;
use App\Models\MenuItem;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

use App\Models\Floor;

class EmployeePOSController extends Controller
{
    /**
     * Get tables grouped by floor for the employee's location.
     */
    public function getTables(Request $request) 
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->first();
        $locationId = $employee ? $employee->location_id : 1; 

        $floors = Floor::where('location_id', $locationId)
            ->where('is_active', true)
            ->with(['tables' => function($q) {
                $q->orderBy('code');
            }])
            ->orderBy('display_order')
            ->get();

        return response()->json([
            'floors' => $floors
        ]);
    }
    /**
     * Store a new POS order.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'table_id' => 'nullable|exists:tables,id',
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string',
            'customer_id' => 'nullable|exists:users,id',
            'notes' => 'nullable|string',
        ]);

        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Find associated employee record
        $employee = Employee::where('user_id', $user->id)->first();
        if (!$employee) {
            // Fallback or error? For now assuming admin/manager might not have employee record but trying to simplify
            // Check if we can proceed without specific employee ID or if we should enforce it.
            // The Order model has 'employee_id'. If nullable, fine. If not, we need one.
            // Let's assume nullable or we use the user's relation if available.
        }
        
        $locationId = $employee ? $employee->location_id : 1; // Default or fail

        return DB::transaction(function () use ($validated, $user, $employee, $locationId) {
            $table = null;
            if (!empty($validated['table_id'])) {
                $table = DiningTable::lockForUpdate()->find($validated['table_id']);
                if ($table->status === 'occupied') {
                     // Check if there is an active order for this table?
                     // For POS, maybe we want to append to it?
                     // For simplicity: if occupied, warn, but maybe allow "adding to tab".
                     // Let's stick to: Create new order.
                }
                $table->update(['status' => 'occupied']);
            }

            $orderType = $table ? 'dine-in' : 'takeout';

            $order = Order::create([
                'order_number' => $this->generateOrderNumber($locationId),
                'location_id' => $locationId,
                'table_id' => $table?->id,
                'employee_id' => $employee?->id,
                'customer_id' => $validated['customer_id'] ?? null,
                'status' => 'received', // POS orders are immediately received/valid
                'payment_status' => 'unpaid',
                'order_type' => $orderType,
                'ordered_at' => now(),
                'currency' => 'USD',
                'special_instructions' => $validated['notes'] ?? null,
            ]);

            $total = 0;
            $itemsToInsert = [];

            // Pre-fetch menu items to avoid N+1
            $itemIds = collect($validated['items'])->pluck('menu_item_id');
            $menuItems = MenuItem::whereIn('id', $itemIds)->get()->keyBy('id');

            foreach ($validated['items'] as $itemData) {
                $menuItem = $menuItems->get($itemData['menu_item_id']);
                if (!$menuItem) continue;

                $lineTotal = $menuItem->price * $itemData['quantity'];
                
                $itemsToInsert[] = [
                    'order_id' => $order->id,
                    'menu_item_id' => $menuItem->id,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $menuItem->price,
                    'total_price' => $lineTotal,
                    'special_instructions' => $itemData['notes'] ?? null,
                    'status' => 'pending', // Kitchen status
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                $total += $lineTotal;
            }

            // Batch insert items
            if (!empty($itemsToInsert)) {
                DB::table('order_items')->insert($itemsToInsert);
            }

            // Update order totals
            // Simple logic for now, tax/service can be added later or via existing logic
            $order->update([
                'subtotal' => $total,
                'total_amount' => $total,
                // 'tax_amount' => ...
            ]);

            return new OrderResource($order->load(['items.menuItem', 'table', 'customer.user']));
        });
    }

    private function generateOrderNumber(int $locationId): string
    {
        return 'POS-' . now()->format('YmdHis') . '-' . rand(100, 999);
    }
}

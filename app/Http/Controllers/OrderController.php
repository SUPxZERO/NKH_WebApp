<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\CustomerRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'location_id' => 'required|exists:locations,id',
            'table_id' => 'nullable|exists:dining_tables,id',
            'order_type' => 'required|in:dine-in,takeout,delivery,pickup',
            'items' => 'required|array',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.special_instructions' => 'nullable|string',
            'customer_address_id' => 'required_if:order_type,delivery|exists:customer_addresses,id',
            'special_instructions' => 'nullable|string',
            'scheduled_at' => 'nullable|date',
        ]);

        // Determine if this is an employee/POS order
        $isEmployeeOrder = Auth::user()->employee !== null;

        $order = new Order($validatedData);
        $order->customer_id = Auth::id();
        $order->employee_id = $isEmployeeOrder ? Auth::user()->employee->id : null;
        $order->order_number = 'ORD-' . time(); // You might want to implement a more sophisticated order number generation
        $order->status = 'pending';
        $order->payment_status = 'pending';
        $order->currency = 'USD'; // You might want to make this configurable

        if ($isEmployeeOrder) {
            // $order->approved_by = Auth::id(); // REMOVED
            // $order->approved_at = now(); // REMOVED
        }

        $order->save();

        // Create order items
        foreach ($validatedData['items'] as $item) {
            $order->items()->create([
                'menu_item_id' => $item['menu_item_id'],
                'quantity' => $item['quantity'],
                'special_instructions' => $item['special_instructions'] ?? null,
            ]);
        }

        return response()->json([
            'message' => 'Order created successfully',
            'order' => $order->load('items'),
        ]);
    }
}
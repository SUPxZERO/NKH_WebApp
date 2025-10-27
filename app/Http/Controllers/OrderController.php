<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\CustomerRequest;
use App\Enums\OrderStatus;
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

        // Set approval status based on order type and user role
        $order->is_auto_approved = $isEmployeeOrder;
        $order->approval_status = $isEmployeeOrder 
            ? OrderStatus::APPROVAL_STATUS_APPROVED 
            : OrderStatus::APPROVAL_STATUS_PENDING;

        if ($isEmployeeOrder) {
            $order->approved_by = Auth::id();
            $order->approved_at = now();
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

        // If this is a customer order that needs approval, create a customer request
        if (!$order->is_auto_approved) {
            CustomerRequest::create([
                'order_id' => $order->id,
                'user_id' => Auth::id(),
                'status' => 'pending',
                'request_type' => $order->order_type,
            ]);
        }

        return response()->json([
            'message' => 'Order created successfully',
            'order' => $order->load('items'),
        ]);
    }

    public function approve(Order $order)
    {
        if (!Auth::user()->employee) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $order->approval_status = OrderStatus::APPROVAL_STATUS_APPROVED;
        $order->approved_by = Auth::id();
        $order->approved_at = now();
        $order->save();

        // Update the associated customer request
        if ($order->customerRequest) {
            $order->customerRequest->update(['status' => 'approved']);
        }

        // Send notification to customer about order approval
        $order->customer->user->notify(new \App\Notifications\OrderStatusChanged($order, 'approved'));
        
        return response()->json(['message' => 'Order approved successfully']);
    }

    public function reject(Order $order, Request $request)
    {
        if (!Auth::user()->employee) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validatedData = $request->validate([
            'rejection_reason' => 'required|string|max:500'
        ]);

        $order->approval_status = OrderStatus::APPROVAL_STATUS_REJECTED;
        $order->rejection_reason = $validatedData['rejection_reason'];
        $order->save();

        // Update the associated customer request
        if ($order->customerRequest) {
            $order->customerRequest->update([
                'status' => 'rejected',
                'rejection_reason' => $validatedData['rejection_reason']
            ]);
        }

        // Send notification to customer about order rejection
        $order->customer->user->notify(new \App\Notifications\OrderStatusChanged(
            $order, 
            'rejected',
            $validatedData['rejection_reason']
        ));
        
        return response()->json(['message' => 'Order rejected successfully']);
    }
}
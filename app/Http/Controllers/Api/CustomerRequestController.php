<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\CustomerRequest;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class CustomerRequestController extends Controller
{
    public function index(Request $request)
    {
        // Removed the where clause if you want the "count" badge in UI 
        // to potentially reflect other states, but keeping it focused 
        // on 'pending' is best for performance if the table is huge.
        $orders = Order::with(['customer.user', 'customerRequest'])
            ->where('approval_status', 'pending')
            ->whereIn('order_type', ['delivery', 'pickup'])
            ->orderBy('ordered_at', 'desc') // Ensure your DB has this column, or use created_at
            ->get();

        if ($request->wantsJson()) {
            return response()->json(['orders' => $orders]);
        }

        return Inertia::render('admin/CustomerRequests', [
            'orders' => $orders
        ]);
    }

    public function show($id) 
    { 
        $order = Order::with(['customer.user'])->find($id);
        
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        return response()->json(['order' => $order]);
    }

    public function update(Request $request, CustomerRequest $customerRequest) 
    { 
        $order = $customerRequest->order;

        $validated = $request->validate([
            'approval_status' => 'required|in:approved,rejected',
            'rejection_reason' => 'required_if:approval_status,rejected|string|nullable|max:1000',
        ]);

        try {
            DB::transaction(function () use ($order, $validated, $request) {
                $order->approval_status = $validated['approval_status'];

                if ($validated['approval_status'] === 'approved') {
                    $order->status = 'received';
                    $order->rejection_reason = null;
                    $order->approved_at = now();
                    if ($request->user()) {
                        $order->approved_by = $request->user()->id;
                    }
                } else {
                    $order->status = 'cancelled';
                    $order->rejection_reason = $validated['rejection_reason'];
                }

                $order->save();
            });

            return response()->json([
                'message' => 'Order updated successfully', 
                'order' => $order->fresh()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update order', 
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
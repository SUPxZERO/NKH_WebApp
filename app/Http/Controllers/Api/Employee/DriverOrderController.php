<?php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\Request;

class DriverOrderController extends Controller
{
    /**
     * List relevant orders for drivers.
     * 1. Available orders: ready, delivery/pickup (mostly delivery), unassigned.
     * 2. My active orders: assigned to me, not completed.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // My active deliveries
        $myDeliveries = Order::with(['items.menuItem', 'customer.user', 'customerAddress'])
            ->where('driver_id', $user->id)
            ->whereNotIn('status', ['completed', 'cancelled', 'delivered']) // 'delivered' might be final status before completed? Or just completed.
            ->latest()
            ->get();

        // Available deliveries (Ready for pickup by driver)
        $availableDeliveries = Order::with(['items.menuItem', 'customer.user', 'customerAddress'])
            ->whereNull('driver_id')
            ->where('order_type', 'delivery')
            ->where('status', 'ready') // Kitchen has marked it ready
            ->latest()
            ->get();

        return response()->json([
            'my_deliveries' => OrderResource::collection($myDeliveries),
            'available_deliveries' => OrderResource::collection($availableDeliveries),
        ]);
    }

    /**
     * Claim an order (assign self as driver)
     */
    public function claim(Request $request, Order $order)
    {
        $user = $request->user();

        if ($order->driver_id) {
            return response()->json(['message' => 'Order is already assigned to a driver.'], 409);
        }

        if ($order->order_type !== 'delivery') {
             return response()->json(['message' => 'Only delivery orders can be claimed.'], 422);
        }

        if ($order->status !== 'ready' && $order->status !== 'preparing') { // Allow claiming while preparing too? Maybe just ready.
             // Let's stick to 'ready' essentially, or 'preparing' if they want to wait. 
             // Actually, usually drivers claim when it's ready or almost ready. Let's allow if not cancelled/completed.
             if (in_array($order->status, ['completed', 'cancelled', 'delivered'])) {
                 return response()->json(['message' => 'Order is not available.'], 422);
             }
        }

        $order->update([
            'driver_id' => $user->id
        ]);

        return new OrderResource($order->load(['items.menuItem', 'customer.user', 'customerAddress']));
    }

    /**
     * Update order status (Driver actions)
     */
    public function updateStatus(Request $request, Order $order)
    {
        $user = $request->user();
        
        if ($order->driver_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'status' => 'required|in:out_for_delivery,delivered'
        ]);
        
        // If delivered, we might want to trigger payment collection if unpaid?
        // Or marked as completed depending on workflow?
        // For now, just update status. 
        // If status is 'delivered', we might implicitly mark order as 'completed' if paid?
        // Let's keep it simple: update status.
        
        $order->update([
            'status' => $request->status
        ]);
        
        if ($request->status === 'delivered') {
             // Maybe log delivered_at?
        }

        return new OrderResource($order->fresh(['items.menuItem', 'customer.user', 'customerAddress']));
    }
}

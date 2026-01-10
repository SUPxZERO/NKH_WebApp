<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class KitchenController extends Controller
{
    /**
     * Get active orders for the Kitchen Display System (KDS).
     * Returns orders with pending, received, preparing, or ready status.
     */
    public function index(): JsonResponse
    {
        try {
            // statuses to fetch
            $statuses = ['pending', 'received', 'preparing', 'ready'];

            $orders = Order::with(['items.menuItem', 'table', 'customer.user', 'customerAddress'])
                ->whereIn('status', $statuses)
                ->orderBy('created_at', 'asc') // Oldest first for kitchen
                ->get();

            $formattedOrders = $orders->map(function ($order) {
                // Get customer info for delivery/pickup orders
                $customerName = null;
                $customerPhone = null;
                $deliveryAddress = null;

                if ($order->customer && $order->customer->user) {
                    $customerName = $order->customer->user->name;
                    $customerPhone = $order->customer->phone ?? $order->customer->user->phone ?? null;
                }

                if ($order->customerAddress) {
                    $deliveryAddress = implode(', ', array_filter([
                        $order->customerAddress->street_address,
                        $order->customerAddress->city,
                        $order->customerAddress->state,
                        $order->customerAddress->postal_code,
                    ]));
                }

                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'table_number' => $order->table ? $order->table->table_number : null,
                    'type' => $order->order_type ?? 'dine-in', // Default to dine-in if null
                    'status' => $order->status,
                    'created_at' => $order->created_at->toIso8601String(),
                    'notes' => $order->special_instructions,
                    'customer_name' => $customerName,
                    'customer_phone' => $customerPhone,
                    'delivery_address' => $deliveryAddress,
                    'subtotal' => (float) $order->subtotal,
                    'total_amount' => (float) $order->total_amount,
                    'items' => $order->items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'name' => $item->menuItem ? $item->menuItem->name : 'Unknown Item',
                            'quantity' => $item->quantity,
                            'notes' => $item->special_instructions,
                            'unit_price' => (float) $item->unit_price,
                            'total_price' => (float) $item->total_price,
                            'status' => $item->status,
                        ];
                    }),
                ];
            });

            return response()->json([
                'data' => $formattedOrders
            ]);

        } catch (\Exception $e) {
            Log::error('Kitchen API Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch kitchen orders', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Update the status of an order.
     */
    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        try {
            $validated = $request->validate([
                'status' => 'required|string|in:preparing,ready,completed,cancelled'
            ]);

            $newStatus = $validated['status'];
            $oldStatus = $order->status;

            // FIX: Use direct assignment instead of update() because 'status' is in $guarded
        // Mass assignment via update() silently ignores guarded fields
        $order->status = $newStatus;
        $order->save();

            // Broadcast real-time update for Kitchen Display and other listeners
            event(new \App\Events\OrderStatusUpdated($order->fresh()));

            // If completed, we might want to record completion time or perform other actions
            // But for now, simple status update is sufficient for KDS

            // Log transition
            Log::info("Order #{$order->order_number} status updated from {$oldStatus} to {$newStatus} by Kitchen");

            // Notify Customer (Telegram etc)
            try {
                app(\App\Services\NotificationService::class)->sendOrderNotification($order, $newStatus);
            } catch (\Exception $e) {
                Log::warning("Failed to send notification via KitchenController: " . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Order status updated successfully',
                'data' => [
                    'id' => $order->id,
                    'status' => $newStatus
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Kitchen Update Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update status'], 500);
        }
    }
}

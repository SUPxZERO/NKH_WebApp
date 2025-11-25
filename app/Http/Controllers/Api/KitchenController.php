<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KitchenController extends Controller
{
    /**
     * Get orders for kitchen display
     * Only shows orders that need kitchen attention
     */
    public function orders(Request $request)
    {
        // Get orders that are NOT completed or cancelled
        $orders = Order::with(['items.menuItem.translations', 'table'])
            ->whereIn('status', ['pending', 'received', 'preparing', 'ready'])
            ->whereIn('type', ['dine-in', 'pickup', 'delivery'])
            ->orderByRaw("FIELD(status, 'pending', 'received', 'preparing', 'ready')")
            ->orderBy('created_at', 'asc')
            ->get();

        $kitchenOrders = $orders->map(function ($order) {
            return [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'table_number' => $order->table?->number,
                'type' => $order->type,
                'status' => $order->status,
                'items' => $order->items->map(function ($item) {
                    $translation = $item->menuItem->translations->firstWhere('locale', app()->getLocale())
                        ?? $item->menuItem->translations->first();

                    return [
                        'id' => $item->id,
                        'name' => $translation ? $translation->name : $item->menuItem->slug,
                        'quantity' => $item->quantity,
                        'notes' => $item->notes,
                    ];
                }),
                'created_at' => $order->created_at->toISOString(),
                'notes' => $order->notes,
            ];
        });

        return response()->json([
            'data' => $kitchenOrders
        ]);
    }

    /**
     * Update order status from kitchen
     */
    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:received,preparing,ready,completed',
        ]);

        $order = Order::findOrFail($id);
        $order->status = $validated['status'];
        
        // Update preparation_status based on status
        if ($validated['status'] === 'preparing') {
            $order->preparation_status = 'in_progress';
        } elseif ($validated['status'] === 'ready') {
            $order->preparation_status = 'completed';
        }

        $order->save();

        return response()->json([
            'message' => 'Order status updated successfully',
            'data' => [
                'id' => $order->id,
                'status' => $order->status,
                'preparation_status' => $order->preparation_status,
            ]
        ]);
    }
}

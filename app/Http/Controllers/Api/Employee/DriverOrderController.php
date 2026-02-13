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
        $driverLat = $request->query('driver_lat');
        $driverLng = $request->query('driver_lng');

        // My active deliveries - orders assigned to me that are not completed/cancelled/delivered
        $myDeliveries = Order::with(['items.menuItem', 'customer.user', 'customerAddress', 'orderStatus'])
            ->where('driver_id', $user->id)
            ->whereHas('orderStatus', function ($q) {
                $q->whereNotIn('code', ['completed', 'cancelled', 'delivered']);
            })
            ->latest()
            ->get();

        // Available deliveries (Ready for pickup by driver)
        $availableQuery = Order::with(['items.menuItem', 'customer.user', 'customerAddress', 'orderStatus', 'orderType'])
            ->whereNull('driver_id')
            ->whereHas('orderType', function ($q) {
                $q->where('code', 'delivery');
            })
            ->whereHas('orderStatus', function ($q) {
                $q->whereIn('code', ['pending', 'preparing', 'ready']);
            });

        // Get available deliveries
        $availableDeliveries = $availableQuery->latest()->get();

        // Sort by distance if driver location provided
        if ($driverLat && $driverLng) {
            $availableDeliveries = $this->sortByProximity(
                $availableDeliveries,
                (float) $driverLat,
                (float) $driverLng
            );
        }

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
        $order->load(['orderType', 'orderStatus']);
        $user = $request->user();

        \Log::info("Driver {$user->id} attempting to claim order {$order->id}", [
            'current_driver' => $order->driver_id,
            'type' => $order->order_type_code,
            'status' => $order->status_code
        ]);

        if ($order->driver_id) {
            return response()->json(['message' => 'Order is already assigned to a driver.'], 409);
        }

        if ($order->order_type_code !== 'delivery') {
             return response()->json(['message' => 'Only delivery orders can be claimed.'], 422);
        }

        // Use status_code for safe comparison
        if ($order->status_code !== 'ready' && $order->status_code !== 'preparing') { 
             if (in_array($order->status_code, ['completed', 'cancelled', 'delivered'])) {
                 return response()->json(['message' => 'Order is not available.'], 422);
             }
        }

        $order->update([
            'driver_id' => $user->id
        ]);

        return new OrderResource($order->load(['items.menuItem', 'customer.user', 'customerAddress', 'orderStatus', 'orderType']));
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
        // NOTE: status is guarded - must use direct assignment
        $order->status = $request->status;
        $order->save();
        
        if ($request->status === 'delivered') {
             // Maybe log delivered_at?
        }

        return new OrderResource($order->fresh(['items.menuItem', 'customer.user', 'customerAddress']));
    }

    /**
     * Get map data for driver interface
     * Returns GeoJSON format data for all delivery locations
     */
    public function getMapData(Request $request)
    {
        $user = $request->user();

        // My active deliveries
        $myDeliveries = Order::with(['customerAddress'])
            ->where('driver_id', $user->id)
            ->whereHas('orderStatus', function ($q) {
                $q->whereNotIn('code', ['completed', 'cancelled', 'delivered']);
            })
            ->get();

        // Available deliveries
        $availableDeliveries = Order::with(['customerAddress'])
            ->whereNull('driver_id')
            ->whereHas('orderType', function ($q) {
                $q->where('code', 'delivery');
            })
            ->whereHas('orderStatus', function ($q) {
                $q->where('code', 'ready');
            })
            ->get();

        return response()->json([
            'type' => 'FeatureCollection',
            'features' => [
                ...$this->ordersToGeoJSON($myDeliveries, 'my_delivery'),
                ...$this->ordersToGeoJSON($availableDeliveries, 'available'),
            ]
        ]);
    }

    /**
     * Sort orders by proximity to driver location
     */
    protected function sortByProximity($orders, float $driverLat, float $driverLng)
    {
        return $orders->sortBy(function ($order) use ($driverLat, $driverLng) {
            if (!$order->customerAddress || !$order->customerAddress->latitude) {
                return PHP_FLOAT_MAX; // Put orders without coordinates at the end
            }

            return $this->calculateDistance(
                $driverLat,
                $driverLng,
                $order->customerAddress->latitude,
                $order->customerAddress->longitude
            );
        })->values();
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     * Returns distance in kilometers
     */
    protected function calculateDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371; // km

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Convert orders to GeoJSON features
     */
    protected function ordersToGeoJSON($orders, string $type): array
    {
        $features = [];

        foreach ($orders as $order) {
            if (!$order->customerAddress || !$order->customerAddress->latitude) {
                continue; // Skip orders without coordinates
            }

            $features[] = [
                'type' => 'Feature',
                'geometry' => [
                    'type' => 'Point',
                    'coordinates' => [
                        $order->customerAddress->longitude,
                        $order->customerAddress->latitude
                    ]
                ],
                'properties' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'delivery_type' => $type,
                    'status' => $order->status_code,
                    'customer_name' => $order->owner_name,
                    'customer_phone' => $order->contact_phone,
                    'total_amount' => $order->total_amount,
                    'payment_status' => $order->payment_status,
                ]
            ];
        }

        return $features;
    }
}

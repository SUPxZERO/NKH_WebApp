<?php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\RouteOptimizationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class RouteOptimizationController extends Controller
{
    protected RouteOptimizationService $routeService;

    public function __construct(RouteOptimizationService $routeService)
    {
        $this->routeService = $routeService;
    }

    /**
     * Optimize route for multiple delivery orders
     *
     * POST /api/employee/driver/orders/optimize-route
     * Body: {
     *   "order_ids": [1, 2, 3],
     *   "driver_location": {"lat": 11.5564, "lng": 104.9282}
     * }
     */
    public function optimizeRoute(Request $request)
    {
        $validated = $request->validate([
            'order_ids' => 'required|array|min:1|max:25',
            'order_ids.*' => 'required|integer|exists:orders,id',
            'driver_location' => 'required|array',
            'driver_location.lat' => 'required|numeric|between:-90,90',
            'driver_location.lng' => 'required|numeric|between:-180,180',
        ]);

        try {
            // Fetch orders with addresses
            $orders = Order::with('customerAddress')
                ->whereIn('id', $validated['order_ids'])
                ->get();

            // Filter orders with valid coordinates
            $deliveryLocations = [];
            $ordersWithoutCoords = [];

            foreach ($orders as $order) {
                if ($order->customerAddress && 
                    $order->customerAddress->latitude && 
                    $order->customerAddress->longitude) {
                    $deliveryLocations[] = [
                        'id' => $order->id,
                        'order_number' => $order->order_number,
                        'lat' => (float) $order->customerAddress->latitude,
                        'lng' => (float) $order->customerAddress->longitude,
                        'address' => $order->customerAddress->full_address,
                    ];
                } else {
                    $ordersWithoutCoords[] = $order->id;
                }
            }

            if (empty($deliveryLocations)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No orders have valid coordinates for route optimization'
                ], 422);
            }

            // Optimize route
            $result = $this->routeService->optimizeRoute(
                $validated['driver_location'],
                $deliveryLocations
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'optimized_order_ids' => $result['order_sequence'],
                    'total_distance_km' => $result['total_distance_km'],
                    'total_duration_min' => $result['total_duration_min'],
                    'waypoints' => $result['waypoints'],
                    'route_geometry' => $result['route_geometry'],
                    'orders_without_coordinates' => $ordersWithoutCoords,
                ]
            ]);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Route optimization failed', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to optimize route. Please try again.'
            ], 500);
        }
    }

    /**
     * Get route between two points
     *
     * POST /api/employee/driver/route
     * Body: {
     *   "from": {"lat": 11.5564, "lng": 104.9282},
     *   "to": {"lat": 11.5600, "lng": 104.9300}
     * }
     */
    public function getRoute(Request $request)
    {
        $validated = $request->validate([
            'from' => 'required|array',
            'from.lat' => 'required|numeric|between:-90,90',
            'from.lng' => 'required|numeric|between:-180,180',
            'to' => 'required|array',
            'to.lat' => 'required|numeric|between:-90,90',
            'to.lng' => 'required|numeric|between:-180,180',
        ]);

        try {
            $route = $this->routeService->getRoute(
                $validated['from'],
                $validated['to']
            );

            return response()->json([
                'success' => true,
                'data' => $route
            ]);

        } catch (\Exception $e) {
            Log::error('Route calculation failed', [
                'message' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to calculate route'
            ], 500);
        }
    }
}

<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class RouteOptimizationService
{
    protected string $osrmUrl;
    protected string $profile;
    protected int $maxWaypoints;
    protected int $timeout;

    public function __construct()
    {
        $this->osrmUrl = config('services.osrm.url');
        $this->profile = config('services.osrm.profile');
        $this->maxWaypoints = config('services.osrm.max_waypoints', 25);
        $this->timeout = config('services.osrm.timeout', 10);
    }

    /**
     * Optimize route for multiple delivery locations
     * Uses greedy nearest-neighbor algorithm
     *
     * @param array $driverLocation ['lat' => float, 'lng' => float]
     * @param array $deliveryLocations [['id' => int, 'lat' => float, 'lng' => float], ...]
     * @return array ['order_sequence' => [...], 'total_distance' => float, 'total_duration' => float, 'route' => [...]]
     */
    public function optimizeRoute(array $driverLocation, array $deliveryLocations): array
    {
        if (empty($deliveryLocations)) {
            return [
                'order_sequence' => [],
                'total_distance_km' => 0,
                'total_duration_min' => 0,
                'waypoints' => [],
                'route_geometry' => null,
            ];
        }

        // Limit waypoints
        if (count($deliveryLocations) > $this->maxWaypoints) {
            throw new \InvalidArgumentException("Maximum {$this->maxWaypoints} waypoints allowed");
        }

        // Calculate distance matrix
        $distanceMatrix = $this->calculateDistanceMatrix($driverLocation, $deliveryLocations);

        // Apply greedy nearest-neighbor algorithm
        $optimizedSequence = $this->greedyNearestNeighbor($driverLocation, $deliveryLocations, $distanceMatrix);

        // Get detailed route with OSRM
        $routeDetails = $this->getDetailedRoute($driverLocation, $optimizedSequence);

        return [
            'order_sequence' => array_map(fn($loc) => $loc['id'], $optimizedSequence),
            'total_distance_km' => $routeDetails['distance_km'],
            'total_duration_min' => $routeDetails['duration_min'],
            'waypoints' => $optimizedSequence,
            'route_geometry' => $routeDetails['geometry'],
        ];
    }

    /**
     * Calculate distance matrix between driver location and all delivery points
     *
     * @param array $driverLocation
     * @param array $deliveryLocations
     * @return array 2D array of distances
     */
    protected function calculateDistanceMatrix(array $driverLocation, array $deliveryLocations): array
    {
        $allLocations = array_merge([$driverLocation], $deliveryLocations);
        $matrix = [];

        // Check cache first
        $cacheKey = 'route_matrix_' . md5(json_encode($allLocations));
        if ($cached = Cache::get($cacheKey)) {
            return $cached;
        }

        // Build coordinates string for OSRM table service
        $coordinates = array_map(function ($loc) {
            return $loc['lng'] . ',' . $loc['lat']; // OSRM uses lng,lat format
        }, $allLocations);

        $coordinatesStr = implode(';', $coordinates);

        try {
            $response = Http::timeout($this->timeout)
                ->get("{$this->osrmUrl}/table/v1/{$this->profile}/{$coordinatesStr}", [
                    'annotations' => 'distance,duration',
                ]);

            if (!$response->successful()) {
                Log::error('OSRM table request failed', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return $this->fallbackDistanceMatrix($allLocations);
            }

            $data = $response->json();

            if ($data['code'] !== 'Ok') {
                Log::warning('OSRM returned non-OK code', ['code' => $data['code']]);
                return $this->fallbackDistanceMatrix($allLocations);
            }

            $matrix = $data['distances'] ?? [];

            // Cache for 5 minutes
            Cache::put($cacheKey, $matrix, 300);

            return $matrix;

        } catch (\Exception $e) {
            Log::error('OSRM table request exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->fallbackDistanceMatrix($allLocations);
        }
    }

    /**
     * Fallback distance calculation using Haversine formula
     */
    protected function fallbackDistanceMatrix(array $locations): array
    {
        $matrix = [];
        $count = count($locations);

        for ($i = 0; $i < $count; $i++) {
            $matrix[$i] = [];
            for ($j = 0; $j < $count; $j++) {
                if ($i === $j) {
                    $matrix[$i][$j] = 0;
                } else {
                    $matrix[$i][$j] = $this->haversineDistance(
                        $locations[$i]['lat'],
                        $locations[$i]['lng'],
                        $locations[$j]['lat'],
                        $locations[$j]['lng']
                    ) * 1000; // Convert to meters for consistency with OSRM
                }
            }
        }

        return $matrix;
    }

    /**
     * Haversine distance calculation
     * Returns distance in kilometers
     */
    protected function haversineDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
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
     * Greedy nearest-neighbor algorithm for route optimization
     *
     * @param array $start Starting location
     * @param array $locations Delivery locations to visit
     * @param array $distanceMatrix Distance matrix
     * @return array Optimized sequence of locations
     */
    protected function greedyNearestNeighbor(array $start, array $locations, array $distanceMatrix): array
    {
        $route = [];
        $remaining = $locations;
        $currentIndex = 0; // Driver location is index 0

        while (!empty($remaining)) {
            $nearestIndex = null;
            $minDistance = PHP_FLOAT_MAX;

            // Find nearest unvisited location
            foreach ($remaining as $key => $location) {
                // Index in distance matrix is currentIndex to (key + 1) because driver is at 0
                $locationIndex = array_search($location, $locations, true) + 1;
                $distance = $distanceMatrix[$currentIndex][$locationIndex] ?? PHP_FLOAT_MAX;

                if ($distance < $minDistance) {
                    $minDistance = $distance;
                    $nearestIndex = $key;
                }
            }

            if ($nearestIndex !== null) {
                $nearestLocation = $remaining[$nearestIndex];
                $route[] = $nearestLocation;
                $currentIndex = array_search($nearestLocation, $locations, true) + 1;
                unset($remaining[$nearestIndex]);
            } else {
                break;
            }
        }

        return $route;
    }

    /**
     * Get detailed route from OSRM including geometry
     *
     * @param array $start
     * @param array $waypoints
     * @return array
     */
    protected function getDetailedRoute(array $start, array $waypoints): array
    {
        if (empty($waypoints)) {
            return [
                'distance_km' => 0,
                'duration_min' => 0,
                'geometry' => null,
            ];
        }

        $allPoints = array_merge([$start], $waypoints);

        // Build coordinates string
        $coordinates = array_map(function ($loc) {
            return $loc['lng'] . ',' . $loc['lat'];
        }, $allPoints);

        $coordinatesStr = implode(';', $coordinates);

        try {
            $response = Http::timeout($this->timeout)
                ->get("{$this->osrmUrl}/route/v1/{$this->profile}/{$coordinatesStr}", [
                    'overview' => 'full',
                    'geometries' => 'geojson',
                    'steps' => false,
                ]);

            if (!$response->successful()) {
                Log::error('OSRM route request failed', [
                    'status' => $response->status()
                ]);
                return $this->fallbackRouteDetails($allPoints);
            }

            $data = $response->json();

            if ($data['code'] !== 'Ok' || empty($data['routes'])) {
                return $this->fallbackRouteDetails($allPoints);
            }

            $route = $data['routes'][0];

            return [
                'distance_km' => round(($route['distance'] ?? 0) / 1000, 2),
                'duration_min' => round(($route['duration'] ?? 0) / 60, 1),
                'geometry' => $route['geometry'] ?? null,
            ];

        } catch (\Exception $e) {
            Log::error('OSRM route request exception', [
                'message' => $e->getMessage()
            ]);
            return $this->fallbackRouteDetails($allPoints);
        }
    }

    /**
     * Fallback route details calculation
     */
    protected function fallbackRouteDetails(array $points): array
    {
        $totalDistance = 0;

        for ($i = 0; $i < count($points) - 1; $i++) {
            $totalDistance += $this->haversineDistance(
                $points[$i]['lat'],
                $points[$i]['lng'],
                $points[$i + 1]['lat'],
                $points[$i + 1]['lng']
            );
        }

        // Rough estimate: 40 km/h average city driving speed
        $durationMin = ($totalDistance / 40) * 60;

        return [
            'distance_km' => round($totalDistance, 2),
            'duration_min' => round($durationMin, 1),
            'geometry' => null, // Can't generate geometry without OSRM
        ];
    }

    /**
     * Get route between two points
     *
     * @param array $from ['lat' => float, 'lng' => float]
     * @param array $to ['lat' => float, 'lng' => float]
     * @return array
     */
    public function getRoute(array $from, array $to): array
    {
        $coordinates = "{$from['lng']},{$from['lat']};{$to['lng']},{$to['lat']}";

        try {
            $response = Http::timeout($this->timeout)
                ->get("{$this->osrmUrl}/route/v1/{$this->profile}/{$coordinates}", [
                    'overview' => 'full',
                    'geometries' => 'geojson',
                ]);

            if (!$response->successful()) {
                return $this->fallbackSingleRoute($from, $to);
            }

            $data = $response->json();

            if ($data['code'] !== 'Ok' || empty($data['routes'])) {
                return $this->fallbackSingleRoute($from, $to);
            }

            $route = $data['routes'][0];

            return [
                'distance_km' => round(($route['distance'] ?? 0) / 1000, 2),
                'duration_min' => round(($route['duration'] ?? 0) / 60, 1),
                'geometry' => $route['geometry'] ?? null,
            ];

        } catch (\Exception $e) {
            return $this->fallbackSingleRoute($from, $to);
        }
    }

    /**
     * Fallback single route calculation
     */
    protected function fallbackSingleRoute(array $from, array $to): array
    {
        $distance = $this->haversineDistance(
            $from['lat'],
            $from['lng'],
            $to['lat'],
            $to['lng']
        );

        return [
            'distance_km' => round($distance, 2),
            'duration_min' => round(($distance / 40) * 60, 1),
            'geometry' => null,
        ];
    }
}

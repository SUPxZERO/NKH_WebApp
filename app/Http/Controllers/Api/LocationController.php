<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Location\StoreLocationRequest;
use App\Http\Requests\Api\Location\UpdateLocationRequest;
use App\Http\Resources\LocationResource;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LocationController extends Controller
{
    // GET /api/locations (public - returns active locations)
    public function index(): AnonymousResourceCollection
    {
        $query = Location::query()->where('is_active', true)->orderBy('name');
        return LocationResource::collection($query->paginate());
    }

    // GET /api/admin/locations (admin - returns all locations with filters)
    public function adminIndex(Request $request)
    {
        $query = Location::query();

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        // Filter by service types
        if ($request->has('service_type')) {
            switch ($request->service_type) {
                case 'online':
                    $query->where('accepts_online_orders', true);
                    break;
                case 'pickup':
                    $query->where('accepts_pickup', true);
                    break;
                case 'delivery':
                    $query->where('accepts_delivery', true);
                    break;
            }
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->get('per_page', 15);
        $locations = $query->paginate($perPage);

        return response()->json($locations);
    }

    // POST /api/locations (role:admin,manager)
    public function store(StoreLocationRequest $request): LocationResource
    {
        $data = $request->validated();
        $location = Location::create($data);
        return new LocationResource($location);
    }

    // GET /api/locations/{location}
    public function show(Location $location): LocationResource
    {
        return new LocationResource($location);
    }

    // PUT /api/locations/{location} (role:admin,manager)
    public function update(UpdateLocationRequest $request, Location $location): LocationResource
    {
        $location->update($request->validated());
        return new LocationResource($location);
    }

    // DELETE /api/locations/{location} (role:admin,manager)
    public function destroy(Location $location)
    {
        // Check if location has dependencies
        if ($location->employees()->exists() || $location->orders()->exists()) {
            return response()->json([
                'message' => 'Cannot delete location with existing employees or orders. Please mark as inactive instead.'
            ], 422);
        }

        $location->delete();
        return response()->json(['message' => 'Location deleted successfully.']);
    }
}

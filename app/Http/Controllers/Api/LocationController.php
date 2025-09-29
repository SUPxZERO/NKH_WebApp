<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Location\StoreLocationRequest;
use App\Http\Requests\Api\Location\UpdateLocationRequest;
use App\Http\Resources\LocationResource;
use App\Models\Location;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LocationController extends Controller
{
    // GET /api/locations (public)
    public function index(): AnonymousResourceCollection
    {
        $query = Location::query()->where('is_active', true)->orderBy('name');
        return LocationResource::collection($query->paginate());
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
        $location->delete();
        return response()->json(['message' => 'Location deleted.']);
    }
}

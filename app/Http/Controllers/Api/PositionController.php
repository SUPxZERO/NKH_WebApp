<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Position\StorePositionRequest;
use App\Http\Requests\Api\Position\UpdatePositionRequest;
use App\Http\Resources\PositionResource;
use App\Models\Position;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PositionController extends Controller
{
    // GET /api/positions (public)
    public function index(): AnonymousResourceCollection
    {
        $query = Position::query()->where('is_active', true)->orderBy('title');
        return PositionResource::collection($query->paginate());
    }

    // GET /api/admin/positions (admin)
    public function adminIndex(Request $request)
    {
        $query = Position::withCount('employees');

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'title');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->get('per_page', 15);
        $positions = $query->paginate($perPage);

        return response()->json($positions);
    }

    // POST /api/positions (role:admin,manager)
    public function store(StorePositionRequest $request): PositionResource
    {
        $data = $request->validated();
        $position = Position::create($data);
        return new PositionResource($position);
    }

    // GET /api/positions/{position}
    public function show(Position $position): PositionResource
    {
        $position->loadCount('employees');
        return new PositionResource($position);
    }

    // PUT /api/positions/{position} (role:admin,manager)
    public function update(UpdatePositionRequest $request, Position $position): PositionResource
    {
        $position->update($request->validated());
        return new PositionResource($position);
    }

    // DELETE /api/positions/{position} (role:admin,manager)
    public function destroy(Position $position)
    {
        // Check if position has employees
        if ($position->employees()->exists()) {
            return response()->json([
                'message' => 'Cannot delete position with  existing employees. Please mark as inactive instead.'
            ], 422);
        }

        $position->delete();
        return response()->json(['message' => 'Position deleted successfully.']);
    }
}

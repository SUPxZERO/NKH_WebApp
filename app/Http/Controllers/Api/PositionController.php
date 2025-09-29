<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Position\StorePositionRequest;
use App\Http\Requests\Api\Position\UpdatePositionRequest;
use App\Http\Resources\PositionResource;
use App\Models\Position;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PositionController extends Controller
{
    // GET /api/positions (public)
    public function index(): AnonymousResourceCollection
    {
        $query = Position::query()->where('is_active', true)->orderBy('title');
        return PositionResource::collection($query->paginate());
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
        $position->delete();
        return response()->json(['message' => 'Position deleted.']);
    }
}

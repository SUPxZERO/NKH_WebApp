<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Floor;
use Illuminate\Http\JsonResponse;

class FloorController extends Controller
{
    // GET /api/admin/floors
    public function index(Request $request)
    {
        $query = Floor::query()->with(['location', 'tables']);

        if ($request->filled('location_id')) {
            $query->where('location_id', (int) $request->location_id);
        }
        if ($request->filled('is_active')) {
            $query->where('is_active', (int) $request->is_active);
        }
        if ($request->filled('search')) {
            $s = $request->string('search');
            $query->where('name', 'like', "%{$s}%");
        }

        return $query->orderBy('display_order')->paginate($request->integer('per_page', 12));
    }

    // POST /api/admin/floors
    public function store(Request $request)
    {
        $data = $request->validate([
            'location_id' => ['required', 'exists:locations,id'],
            'name' => ['required', 'string', 'max:120'],
            'display_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $floor = Floor::create([
            'location_id' => $data['location_id'],
            'name' => $data['name'],
            'display_order' => $data['display_order'] ?? 0,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return $floor->load(['location', 'tables']);
    }

    // GET /api/admin/floors/{floor}
    public function show(Floor $floor)
    {
        return $floor->load(['location', 'tables']);
    }

    // PUT/PATCH /api/admin/floors/{floor}
    public function update(Request $request, Floor $floor)
    {
        $data = $request->validate([
            'location_id' => ['sometimes', 'exists:locations,id'],
            'name' => ['sometimes', 'string', 'max:120'],
            'display_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $floor->update($data);
        return $floor->fresh(['location', 'tables']);
    }

    // DELETE /api/admin/floors/{floor}
    public function destroy(Floor $floor): JsonResponse
    {
        $floor->delete();
        return response()->json(['message' => 'Floor deleted successfully.']);
    }
}

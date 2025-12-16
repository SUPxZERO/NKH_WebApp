<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Table\UpdateTableStatusRequest;
use App\Http\Resources\DiningTableResource;
use App\Models\DiningTable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TableController extends Controller
{
    // GET /api/tables (role:admin,manager,waiter)
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = DiningTable::query()->with('floor');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }
        if ($request->filled('floor_id')) {
            $query->where('floor_id', (int) $request->floor_id);
        }
        if ($request->filled('search')) {
            $s = $request->string('search');
            $query->where(function ($q) use ($s) {
                $q->where('code', 'like', "%{$s}%");
            });
        }

        $tables = $query->orderBy('id')->paginate($request->integer('per_page', 12));
        return DiningTableResource::collection($tables);
    }

    public function show(DiningTable $table): DiningTableResource
    {
        return new DiningTableResource($table->load('floor'));
    }

    // GET /api/admin/tables/grouped - Returns tables grouped by floor
    public function grouped(Request $request): JsonResponse
    {
        $query = \App\Models\Floor::query()->with(['tables' => function ($q) use ($request) {
            if ($request->filled('status')) {
                $q->where('status', $request->string('status'));
            }
            if ($request->filled('search')) {
                $s = $request->string('search');
                $q->where('code', 'like', "%{$s}%");
            }
        }]);

        if ($request->filled('floor_id')) {
            $query->where('id', (int) $request->floor_id);
        }

        $floors = $query->get();

        // Calculate totals
        $allTables = DiningTable::query();
        if ($request->filled('status')) {
            $allTables->where('status', $request->string('status'));
        }
        if ($request->filled('floor_id')) {
            $allTables->where('floor_id', (int) $request->floor_id);
        }
        if ($request->filled('search')) {
            $s = $request->string('search');
            $allTables->where('code', 'like', "%{$s}%");
        }

        $tables = $allTables->get();

        return response()->json([
            'floors' => $floors->map(function ($floor) {
                return [
                    'floor' => $floor,
                    'tables' => $floor->tables
                ];
            }),
            'totals' => [
                'total' => $tables->count(),
                'available' => $tables->where('status', 'available')->count(),
                'occupied' => $tables->where('status', 'occupied')->count(),
                'reserved' => $tables->where('status', 'reserved')->count(),
            ]
        ]);
    }

    public function store(Request $request): DiningTableResource
    {
        $data = $request->validate([
            'floor_id' => ['required','exists:floors,id'],
            'code' => ['required','string','max:50'],
            'capacity' => ['required','integer','min:1'],
            'status' => ['sometimes','in:available,reserved,occupied,unavailable'],
        ]);

        $table = DiningTable::create([
            'floor_id' => $data['floor_id'],
            'code' => $data['code'],
            'capacity' => $data['capacity'],
            'status' => $data['status'] ?? 'available',
        ]);

        return new DiningTableResource($table->load('floor'));
    }

    public function update(Request $request, DiningTable $table): DiningTableResource
    {
        $data = $request->validate([
            'floor_id' => ['sometimes','exists:floors,id'],
            'code' => ['sometimes','string','max:50'],
            'capacity' => ['sometimes','integer','min:1'],
            'status' => ['sometimes','in:available,reserved,occupied,unavailable'],
        ]);

        $table->update($data);
        return new DiningTableResource($table->fresh('floor'));
    }

    // PUT /api/tables/{table}/status (role:admin,manager,waiter)
    public function updateStatus(UpdateTableStatusRequest $request, DiningTable $table)
    {
        $table->update(['status' => $request->validated()['status']]);
        return new DiningTableResource($table);
    }

    public function destroy(DiningTable $table): JsonResponse
    {
        $table->delete();
        return response()->json(['message' => 'Table deleted successfully.']);
    }
}

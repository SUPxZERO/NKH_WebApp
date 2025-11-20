<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DiningTable;
use App\Models\Floor;
use Illuminate\Http\Request;

class TableController extends Controller
{
    // GET /api/admin/tables/grouped
    public function index(Request $request)
    {
        $status = $request->string('status');
        $search = $request->string('search');
        $floorId = $request->integer('floor_id');

        $floorsQuery = Floor::query()->orderBy('display_order');
        if ($request->filled('floor_id')) {
            $floorsQuery->where('id', $floorId);
        }

        $floors = $floorsQuery->get();

        // Build base table query with filters
        $tableBase = DiningTable::query();
        if ($request->filled('status')) {
            $tableBase->where('status', $status);
        }
        if ($request->filled('floor_id')) {
            $tableBase->where('floor_id', $floorId);
        }
        if ($request->filled('search')) {
            $tableBase->where('code', 'like', "%{$search}%");
        }

        // Totals after filters
        $totals = [
            'total' => (clone $tableBase)->count(),
            'available' => (clone $tableBase)->where('status', 'available')->count(),
            'reserved' => (clone $tableBase)->where('status', 'reserved')->count(),
            'occupied' => (clone $tableBase)->where('status', 'occupied')->count(),
            'unavailable' => (clone $tableBase)->where('status', 'unavailable')->count(),
        ];

        // Load tables per floor using the same filters
        $grouped = $floors->map(function (Floor $floor) use ($tableBase) {
            $tables = (clone $tableBase)
                ->where('floor_id', $floor->id)
                ->orderBy('id')
                ->get(['id','floor_id','code','capacity','status','created_at','updated_at']);

            return [
                'floor' => [
                    'id' => $floor->id,
                    'name' => $floor->name,
                ],
                'tables' => $tables,
            ];
        })->values();

        return response()->json([
            'floors' => $grouped,
            'totals' => $totals,
        ]);
    }
}

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

    // ==================== QR CODE ENDPOINTS ====================

    /**
     * Generate or regenerate QR code for a table
     * POST /api/admin/tables/{table}/generate-qr
     */
    public function generateQr(DiningTable $table): JsonResponse
    {
        $service = app(\App\Services\QrTableService::class);
        
        try {
            $token = $service->generateQrForTable($table);
            
            return response()->json([
                'success' => true,
                'message' => 'QR code generated successfully',
                'data' => [
                    'table_id' => $table->id,
                    'table_code' => $table->code,
                    'qr_token' => $token,
                    'qr_url' => $table->getQrUrl(),
                    'generated_at' => $table->qr_generated_at->toIso8601String(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate QR code',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get QR code image for a table
     * GET /api/admin/tables/{table}/qr-image
     */
    public function getQrImage(Request $request, DiningTable $table): JsonResponse
    {
        $service = app(\App\Services\QrTableService::class);
        $size = $request->integer('size', 300);
        $format = $request->string('format', 'base64');

        try {
            // Generate QR if not exists
            if (!$table->hasQrToken()) {
                $service->generateQrForTable($table);
            }

            if ($format === 'svg') {
                $image = $service->getQrImageSvg($table, $size);
                return response()->json([
                    'success' => true,
                    'format' => 'svg',
                    'image' => $image,
                ]);
            }

            $imageBase64 = $service->getQrImageBase64($table, $size);
            
            return response()->json([
                'success' => true,
                'format' => 'base64',
                'image' => $imageBase64,
                'table_code' => $table->code,
                'qr_url' => $table->getQrUrl(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate QR image',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Bulk generate QR codes for multiple tables
     * POST /api/admin/tables/bulk-generate-qr
     */
    public function bulkGenerateQr(Request $request): JsonResponse
    {
        $request->validate([
            'table_ids' => 'required|array|min:1',
            'table_ids.*' => 'exists:tables,id',
        ]);

        $service = app(\App\Services\QrTableService::class);
        $results = $service->bulkGenerateQr($request->table_ids);

        $successCount = collect($results)->where('success', true)->count();
        $failCount = collect($results)->where('success', false)->count();

        return response()->json([
            'success' => $failCount === 0,
            'message' => "{$successCount} QR codes generated" . ($failCount > 0 ? ", {$failCount} failed" : ""),
            'results' => $results,
        ]);
    }

    /**
     * Get QR statistics
     * GET /api/admin/tables/qr-stats
     */
    public function qrStats(): JsonResponse
    {
        $service = app(\App\Services\QrTableService::class);
        
        return response()->json([
            'success' => true,
            'data' => $service->getStatistics(),
        ]);
    }

    /**
     * Get printable QR data for a table
     * GET /api/admin/tables/{table}/printable-qr
     */
    public function getPrintableQr(DiningTable $table): JsonResponse
    {
        $service = app(\App\Services\QrTableService::class);

        try {
            // Generate QR if not exists
            if (!$table->hasQrToken()) {
                $service->generateQrForTable($table);
            }

            return response()->json([
                'success' => true,
                'data' => $service->getPrintableData($table),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get printable data',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

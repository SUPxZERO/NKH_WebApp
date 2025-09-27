<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Table\UpdateTableStatusRequest;
use App\Http\Resources\DiningTableResource;
use App\Models\DiningTable;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TableController extends Controller
{
    // GET /api/tables (role:admin,manager,waiter)
    public function index(): AnonymousResourceCollection
    {
        $tables = DiningTable::query()->orderBy('id')->paginate();
        return DiningTableResource::collection($tables);
    }

    // PUT /api/tables/{table}/status (role:admin,manager,waiter)
    public function updateStatus(UpdateTableStatusRequest $request, DiningTable $table)
    {
        $table->update(['status' => $request->validated()['status']]);
        return new DiningTableResource($table);
    }
}

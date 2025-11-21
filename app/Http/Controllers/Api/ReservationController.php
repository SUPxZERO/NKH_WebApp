<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReservationController extends Controller
{
    // GET /api/admin/reservations
    public function index(Request $request)
    {
        $query = Reservation::query()->with(['table', 'customer.user', 'location']);

        if ($request->filled('search')) {
            $s = $request->string('search');
            $query->where(function ($q) use ($s) {
                $q->where('code', 'like', "%{$s}%")
                  ->orWhere('reservation_number', 'like', "%{$s}%")
                  ->orWhereHas('customer.user', function ($uq) use ($s) {
                      $uq->where('name', 'like', "%{$s}%");
                  });
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->string('status'));
        }

        // Date filters map to reservation_date
        if ($request->filled('date')) {
            $query->whereDate('reservation_date', $request->date('date'));
        }
        if ($request->filled('start_date')) {
            $query->whereDate('reservation_date', '>=', $request->date('start_date'));
        }
        if ($request->filled('end_date')) {
            $query->whereDate('reservation_date', '<=', $request->date('end_date'));
        }

        $res = $query->orderByDesc('reservation_date')
                     ->orderByDesc('reservation_time')
                     ->orderByDesc('id')
                     ->paginate($request->integer('per_page', 12));

        return ReservationResource::collection($res);
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Not implemented'], 501);
    }

    public function show(Reservation $reservation): ReservationResource
    {
        return new ReservationResource($reservation->load(['table', 'customer.user', 'location']));
    }

    public function update(Request $request, Reservation $reservation): JsonResponse
    {
        return response()->json(['message' => 'Not implemented'], 501);
    }

    public function destroy(Reservation $reservation): JsonResponse
    {
        return response()->json(['message' => 'Not implemented'], 501);
    }
}

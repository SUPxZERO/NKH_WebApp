<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Models\DiningTable;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

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

    public function store(Request $request): ReservationResource
    {
        $validated = $request->validate([
            'table_id' => ['required', 'integer', 'exists:tables,id'],
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'reserved_for' => ['required', 'date_format:Y-m-d\\TH:i'],
            'duration_minutes' => ['nullable', 'integer', 'min:30', 'max:480'],
            'guest_count' => ['required', 'integer', 'min:1'],
            'status' => ['nullable', 'in:pending,confirmed,seated,completed,cancelled,no_show'],
            'notes' => ['nullable', 'string'],
        ]);

        $table = DiningTable::with('floor')->findOrFail($validated['table_id']);
        $customer = Customer::findOrFail($validated['customer_id']);

        $floor = $table->floor;
        if (! $floor) {
            abort(422, 'Selected table is not assigned to a floor.');
        }

        $locationId = (int) $floor->location_id;

        $guestCount = (int) $validated['guest_count'];
        if ($guestCount > (int) $table->capacity) {
            abort(422, 'Guest count exceeds table capacity.');
        }

        $reservedAt = Carbon::createFromFormat('Y-m-d\\TH:i', $validated['reserved_for']);
        $reservationDate = $reservedAt->toDateString();
        $reservationTime = $reservedAt->format('H:i:s');

        $slotExists = Reservation::where('location_id', $locationId)
            ->where('table_id', $table->id)
            ->where('reservation_date', $reservationDate)
            ->where('reservation_time', $reservationTime)
            ->exists();

        if ($slotExists) {
            abort(422, 'Selected table is already reserved for that time.');
        }

        $duration = isset($validated['duration_minutes'])
            ? (int) $validated['duration_minutes']
            : 60;
        $status = $validated['status'] ?? 'pending';

        $reservation = DB::transaction(function () use ($customer, $table, $locationId, $reservationDate, $reservationTime, $guestCount, $duration, $status, $validated, $reservedAt) {
            $reservationNumber = $this->generateReservationNumber($locationId, $reservedAt);
            $code = $this->generateReservationCode($reservationNumber);

            $reservedForLabel = $customer->full_name
                ?? $customer->name
                ?? trim(($customer->first_name ?? '') . ' ' . ($customer->last_name ?? ''));

            return Reservation::create([
                'location_id' => $locationId,
                'customer_id' => $customer->id,
                'table_id' => $table->id,
                'code' => $code,
                'reservation_number' => $reservationNumber,
                'reserved_for' => $reservedForLabel ?: (string) $customer->id,
                'party_size' => $guestCount,
                'reservation_date' => $reservationDate,
                'reservation_time' => $reservationTime,
                'duration_minutes' => $duration,
                'guest_count' => $guestCount,
                'status' => $status,
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        return new ReservationResource($reservation->load(['table', 'customer.user', 'location']));
    }

    public function show(Reservation $reservation): ReservationResource
    {
        return new ReservationResource($reservation->load(['table', 'customer.user', 'location']));
    }

    public function update(Request $request, Reservation $reservation): ReservationResource
    {
        $validated = $request->validate([
            'table_id' => ['sometimes', 'integer', 'exists:tables,id'],
            'customer_id' => ['sometimes', 'integer', 'exists:customers,id'],
            'reserved_for' => ['sometimes', 'date_format:Y-m-d\\TH:i'],
            'duration_minutes' => ['sometimes', 'integer', 'min:30', 'max:480'],
            'guest_count' => ['sometimes', 'integer', 'min:1'],
            'status' => ['sometimes', 'in:pending,confirmed,seated,completed,cancelled,no_show'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        $reservation = DB::transaction(function () use ($validated, $reservation) {
            $table = isset($validated['table_id'])
                ? DiningTable::with('floor')->findOrFail($validated['table_id'])
                : $reservation->table()->with('floor')->first();

            if (! $table) {
                abort(422, 'Selected table could not be found.');
            }

            $floor = $table->floor;
            if (! $floor) {
                abort(422, 'Selected table is not assigned to a floor.');
            }

            $locationId = (int) $floor->location_id;

            if (isset($validated['customer_id'])) {
                $customer = Customer::findOrFail($validated['customer_id']);
                $reservedForLabel = $customer->full_name
                    ?? $customer->name
                    ?? trim(($customer->first_name ?? '') . ' ' . ($customer->last_name ?? ''));
                $reservation->customer_id = $customer->id;
                $reservation->reserved_for = $reservedForLabel ?: (string) $customer->id;
            }

            if (isset($validated['reserved_for'])) {
                $reservedAt = Carbon::createFromFormat('Y-m-d\\TH:i', $validated['reserved_for']);
            } else {
                $reservedAt = Carbon::createFromFormat('Y-m-d H:i:s', $reservation->reservation_date.' '.$reservation->reservation_time);
            }

            $reservationDate = $reservedAt->toDateString();
            $reservationTime = $reservedAt->format('H:i:s');

            $guestCount = isset($validated['guest_count'])
                ? (int) $validated['guest_count']
                : ($reservation->party_size ?? $reservation->guest_count ?? 1);

            if ($guestCount > (int) $table->capacity) {
                abort(422, 'Guest count exceeds table capacity.');
            }

            $slotExists = Reservation::where('location_id', $locationId)
                ->where('table_id', $table->id)
                ->where('reservation_date', $reservationDate)
                ->where('reservation_time', $reservationTime)
                ->where('id', '!=', $reservation->id)
                ->exists();

            if ($slotExists) {
                abort(422, 'Selected table is already reserved for that time.');
            }

            $reservation->location_id = $locationId;
            $reservation->table_id = $table->id;
            $reservation->reservation_date = $reservationDate;
            $reservation->reservation_time = $reservationTime;
            $reservation->party_size = $guestCount;
            $reservation->duration_minutes = isset($validated['duration_minutes'])
                ? (int) $validated['duration_minutes']
                : ($reservation->duration_minutes ?? 60);
            $reservation->guest_count = $guestCount;

            if (isset($validated['status'])) {
                $reservation->status = $validated['status'];
            }

            if (array_key_exists('notes', $validated)) {
                $reservation->notes = $validated['notes'];
            }

            $reservation->save();

            return $reservation;
        });

        return new ReservationResource($reservation->load(['table', 'customer.user', 'location']));
    }

    public function destroy(Reservation $reservation): JsonResponse
    {
        if ($reservation->status !== 'cancelled') {
            $reservation->status = 'cancelled';
            $reservation->save();
        }

        return response()->json(['message' => 'Reservation cancelled']);
    }

    private function generateReservationNumber(int $locationId, Carbon $date): string
    {
        $attempts = 0;
        $maxAttempts = 10;

        do {
            $number = 'RES-' . $locationId . '-' . $date->format('Ymd') . '-' . str_pad(random_int(1, 9999), 4, '0', STR_PAD_LEFT);
            $exists = Reservation::where('reservation_number', $number)->exists();
            $attempts++;
        } while ($exists && $attempts < $maxAttempts);

        return $number;
    }

    private function generateReservationCode(string $reservationNumber): string
    {
        $attempts = 0;
        $codeExists = false;
        $code = '';

        do {
            $code = substr(md5($reservationNumber . Str::random(8) . microtime(true)), 0, 20);
            $codeExists = Reservation::where('code', $code)->exists();
            $attempts++;
        } while ($codeExists && $attempts < 5);

        if ($codeExists) {
            throw new \RuntimeException('Unable to generate unique reservation code.');
        }

        return $code;
    }
}

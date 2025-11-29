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
use Carbon\Carbon;

class CustomerReservationController extends Controller
{
    protected function resolveCustomer(Request $request): Customer
    {
        $customer = null;

        if ($request->user()) {
            $customer = $request->user()->customer ?? null;
        }

        if (! $customer && $request->filled('customer_id')) {
            $customer = Customer::find($request->input('customer_id'));
        }

        if (! $customer) {
            abort(422, 'Customer profile not found. Please ensure you are logged in.');
        }

        return $customer;
    }

    public function index(Request $request)
    {
        $customer = $this->resolveCustomer($request);

        $query = Reservation::query()
            ->where('customer_id', $customer->id)
            ->with(['table', 'location']);

        // By default return upcoming reservations first
        $now = Carbon::now();
        if ($request->boolean('upcoming', true)) {
            $today = $now->toDateString();
            $time = $now->format('H:i:s');

            $query->where(function ($q) use ($today, $time) {
                $q->where('reservation_date', '>', $today)
                  ->orWhere(function ($q2) use ($today, $time) {
                      $q2->where('reservation_date', $today)
                         ->where('reservation_time', '>=', $time);
                  });
            });
        }

        $reservations = $query
            ->orderBy('reservation_date')
            ->orderBy('reservation_time')
            ->get();

        return ReservationResource::collection($reservations);
    }

    public function availability(Request $request)
    {
        $customer = $this->resolveCustomer($request);

        $validated = $request->validate([
            'location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'date' => ['required', 'date_format:Y-m-d'],
            'time' => ['required', 'date_format:H:i'],
            'guest_count' => ['required', 'integer', 'min:1'],
        ]);

        $locationId = (int) ($validated['location_id'] ?? $customer->preferred_location_id ?? 0);
        if (! $locationId) {
            abort(422, 'Location is required to check availability.');
        }

        $guestCount = (int) $validated['guest_count'];
        $time = $validated['time'] . ':00'; // normalize to H:i:s

        $tables = DiningTable::query()
            ->whereHas('floor', function ($q) use ($locationId) {
                $q->where('location_id', $locationId);
            })
            ->where('capacity', '>=', $guestCount)
            ->where('status', '!=', 'unavailable')
            ->orderBy('capacity')
            ->get();

        $availableTable = null;

        foreach ($tables as $table) {
            $hasConflict = Reservation::where('location_id', $locationId)
                ->where('table_id', $table->id)
                ->where('reservation_date', $validated['date'])
                ->where('reservation_time', $time)
                ->where('status', '!=', 'cancelled')
                ->exists();

            if (! $hasConflict) {
                $availableTable = $table;
                break;
            }
        }

        if (! $availableTable) {
            return response()->json([
                'available' => false,
                'message' => 'No tables available for the selected time.',
            ]);
        }

        return response()->json([
            'available' => true,
            'table_id' => $availableTable->id,
            'table_code' => $availableTable->code,
            'capacity' => $availableTable->capacity,
        ]);
    }

    public function store(Request $request)
    {
        $customer = $this->resolveCustomer($request);

        $validated = $request->validate([
            'location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'reserved_for' => ['required', 'date_format:Y-m-d\\TH:i'],
            'guest_count' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string'],
        ]);

        $reservedAt = Carbon::createFromFormat('Y-m-d\\TH:i', $validated['reserved_for']);
        $reservationDate = $reservedAt->toDateString();
        $reservationTime = $reservedAt->format('H:i:s');

        $locationId = (int) ($validated['location_id'] ?? $customer->preferred_location_id ?? 0);
        if (! $locationId) {
            abort(422, 'Location is required to create a reservation.');
        }

        $guestCount = (int) $validated['guest_count'];

        $reservation = DB::transaction(function () use ($customer, $locationId, $reservationDate, $reservationTime, $guestCount, $validated, $reservedAt) {
            // Find best-fit table at this location
            $tables = DiningTable::query()
                ->whereHas('floor', function ($q) use ($locationId) {
                    $q->where('location_id', $locationId);
                })
                ->where('capacity', '>=', $guestCount)
                ->where('status', '!=', 'unavailable')
                ->orderBy('capacity')
                ->get();

            $selectedTable = null;

            foreach ($tables as $table) {
                $hasConflict = Reservation::where('location_id', $locationId)
                    ->where('table_id', $table->id)
                    ->where('reservation_date', $reservationDate)
                    ->where('reservation_time', $reservationTime)
                    ->where('status', '!=', 'cancelled')
                    ->lockForUpdate()
                    ->exists();

                if (! $hasConflict) {
                    $selectedTable = $table;
                    break;
                }
            }

            if (! $selectedTable) {
                abort(409, 'No tables available for the selected time.');
            }

            if ($guestCount > (int) $selectedTable->capacity) {
                abort(422, 'Guest count exceeds table capacity.');
            }

            $reservationNumber = $this->generateReservationNumber($locationId, $reservedAt);
            $code = $this->generateReservationCode($reservationNumber);

            $reservedForLabel = $customer->user->name
                ?? $customer->customer_code
                ?? (string) $customer->id;

            return Reservation::create([
                'location_id' => $locationId,
                'customer_id' => $customer->id,
                'table_id' => $selectedTable->id,
                'code' => $code,
                'reservation_number' => $reservationNumber,
                'reserved_for' => $reservedForLabel,
                'party_size' => $guestCount,
                'reservation_date' => $reservationDate,
                'reservation_time' => $reservationTime,
                'duration_minutes' => 60,
                'guest_count' => $guestCount,
                'status' => 'pending',
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        return new ReservationResource($reservation->load(['table', 'customer.user', 'location']));
    }

    public function destroy(Request $request, Reservation $reservation)
    {
        $customer = $this->resolveCustomer($request);

        if ((int) $reservation->customer_id !== (int) $customer->id) {
            abort(403, 'You can only cancel your own reservations.');
        }

        $now = Carbon::now();
        $reservedAt = Carbon::createFromFormat('Y-m-d H:i:s', $reservation->reservation_date.' '.$reservation->reservation_time);

        if ($reservedAt->isPast()) {
            abort(422, 'You cannot cancel a past reservation.');
        }

        if (! in_array($reservation->status, ['pending', 'confirmed'], true)) {
            abort(422, 'Only pending or confirmed reservations can be cancelled.');
        }

        $reservation->status = 'cancelled';
        $reservation->save();

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
            $code = substr(md5($reservationNumber . random_int(1, PHP_INT_MAX) . microtime(true)), 0, 20);
            $codeExists = Reservation::where('code', $code)->exists();
            $attempts++;
        } while ($codeExists && $attempts < 5);

        if ($codeExists) {
            throw new \RuntimeException('Unable to generate unique reservation code.');
        }

        return $code;
    }
}

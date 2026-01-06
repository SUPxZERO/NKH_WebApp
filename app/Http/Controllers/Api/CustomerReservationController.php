<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Models\DiningTable;
use App\Models\Customer;
use App\Models\Floor;
use App\Models\Location;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CustomerReservationController extends Controller
{
    protected function resolveCustomer(Request $request): Customer
    {
        $customer = null;

        // 1. Standard Auth
        if ($request->user()) {
            $customer = $request->user()->customer ?? null;
        }

        // 2. Telegram Session (set by TelegramWebAppAuth middleware)
        if (!$customer) {
            $telegramData = session('telegram_user');
            if ($telegramData && isset($telegramData['customer_id'])) {
                $customer = Customer::find($telegramData['customer_id']);
            }
        }

        // 3. Fallback to customer_id parameter (legacy)
        if (!$customer && $request->filled('customer_id')) {
            $customer = Customer::find($request->input('customer_id'));
        }

        if (!$customer) {
            abort(422, 'Customer profile not found. Please ensure you are logged in or access via Telegram.');
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

    /**
     * Get floors for a specific location
     */
    public function floors(Request $request)
    {
        $validated = $request->validate([
            'location_id' => ['required', 'integer', 'exists:locations,id'],
        ]);

        $floors = Floor::where('location_id', $validated['location_id'])
            ->where('is_active', true)
            ->orderBy('display_order')
            ->get(['id', 'name', 'location_id']);

        return response()->json(['data' => $floors]);
    }

    /**
     * Get available tables for a specific floor and time slot
     */
    public function tables(Request $request)
    {
        $validated = $request->validate([
            'floor_id' => ['required', 'integer', 'exists:floors,id'],
            'date' => ['nullable', 'date_format:Y-m-d'],
            'time' => ['nullable', 'date_format:H:i'],
            'guest_count' => ['nullable', 'integer', 'min:1'],
        ]);

        $floor = Floor::findOrFail($validated['floor_id']);

        $query = DiningTable::where('floor_id', $floor->id)
            ->where('status', '!=', 'unavailable');

        // Filter by capacity if guest count provided
        if (!empty($validated['guest_count'])) {
            $query->where('capacity', '>=', (int) $validated['guest_count']);
        }

        $tables = $query->orderBy('capacity')->get();

        // If date and time provided, check availability for each table
        if (!empty($validated['date']) && !empty($validated['time'])) {
            $date = $validated['date'];
            $time = $validated['time'] . ':00';

            $tables = $tables->map(function ($table) use ($date, $time, $floor) {
                $isBooked = Reservation::where('location_id', $floor->location_id)
                    ->where('table_id', $table->id)
                    ->where('reservation_date', $date)
                    ->where('reservation_time', $time)
                    ->whereNotIn('status', ['cancelled', 'completed', 'no_show'])
                    ->exists();

                return [
                    'id' => $table->id,
                    'code' => $table->code,
                    'capacity' => $table->capacity,
                    'status' => $table->status,
                    'is_available' => !$isBooked,
                ];
            });
        } else {
            $tables = $tables->map(function ($table) {
                return [
                    'id' => $table->id,
                    'code' => $table->code,
                    'capacity' => $table->capacity,
                    'status' => $table->status,
                    'is_available' => $table->status !== 'unavailable',
                ];
            });
        }

        return response()->json(['data' => $tables]);
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
            'floor_id' => ['nullable', 'integer', 'exists:floors,id'],
            'table_id' => ['nullable', 'integer', 'exists:tables,id'],
            'reserved_for' => ['required', 'date_format:Y-m-d\\TH:i'],
            'guest_count' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string'],
        ]);

        $reservedAt = Carbon::createFromFormat('Y-m-d\\TH:i', $validated['reserved_for']);
        $reservationDate = $reservedAt->toDateString();
        $reservationTime = $reservedAt->format('H:i:s');

        // Determine location from table -> floor -> location chain if table_id provided
        $locationId = null;
        if (!empty($validated['table_id'])) {
            $table = DiningTable::with('floor')->findOrFail($validated['table_id']);
            if ($table->floor) {
                $locationId = $table->floor->location_id;
            }
        }

        // Fallback to provided location_id or customer preference
        if (!$locationId) {
            $locationId = (int) ($validated['location_id'] ?? $customer->preferred_location_id ?? 0);
        }

        if (! $locationId) {
            abort(422, 'Location is required to create a reservation.');
        }

        $guestCount = (int) $validated['guest_count'];

        $reservation = DB::transaction(function () use ($customer, $locationId, $reservationDate, $reservationTime, $guestCount, $validated, $reservedAt) {
            $selectedTable = null;

            // If specific table_id provided, use that table
            if (!empty($validated['table_id'])) {
                $selectedTable = DiningTable::with('floor')->findOrFail($validated['table_id']);

                // Verify table capacity
                if ($guestCount > (int) $selectedTable->capacity) {
                    abort(422, 'Guest count exceeds table capacity.');
                }

                // Check if table is available at this time
                $hasConflict = Reservation::where('location_id', $locationId)
                    ->where('table_id', $selectedTable->id)
                    ->where('reservation_date', $reservationDate)
                    ->where('reservation_time', $reservationTime)
                    ->whereNotIn('status', ['cancelled', 'completed', 'no_show'])
                    ->lockForUpdate()
                    ->exists();

                if ($hasConflict) {
                    abort(409, 'This table is already reserved for the selected time.');
                }
            } else {
                // Find best-fit table at this location (original behavior)
                $tables = DiningTable::query()
                    ->whereHas('floor', function ($q) use ($locationId) {
                        $q->where('location_id', $locationId);
                    })
                    ->where('capacity', '>=', $guestCount)
                    ->where('status', '!=', 'unavailable')
                    ->orderBy('capacity')
                    ->get();

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

        // Send reservation confirmation notification
        try {
            if ($customer->user) {
                $notificationService = app(NotificationService::class);
                $reservedAt = Carbon::parse($reservation->reservation_date . ' ' . $reservation->reservation_time);
                $notificationService->sendSystemNotification(
                    'Reservation Confirmed! 🍽️',
                    "Your table for {$reservation->guest_count} is reserved on {$reservedAt->format('M d, Y')} at {$reservedAt->format('g:i A')}. Code: {$reservation->code}",
                    $customer->user,
                    '/customer/reservations'
                );
            }
        } catch (\Exception $e) {
            \Log::warning('Failed to send reservation notification: ' . $e->getMessage());
        }

        return new ReservationResource($reservation->load(['table', 'customer.user', 'location']));
    }

    public function destroy(Request $request, Reservation $reservation)
    {
        $customer = $this->resolveCustomer($request);

        if ((int) $reservation->customer_id !== (int) $customer->id) {
            abort(403, 'You can only cancel your own reservations.');
        }

        if (! $reservation->canCustomerCancel()) {
            abort(422, 'You can only cancel before the reservation day.');
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

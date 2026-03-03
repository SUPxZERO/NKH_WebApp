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
use App\Services\ReservationService;
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
            abort(422, __('messages.api.errors.customer_profile_not_found_long'));
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
        if (!$locationId) {
            abort(422, __('messages.api.errors.location_required_check'));
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

            if (!$hasConflict) {
                $availableTable = $table;
                break;
            }
        }

        if (!$availableTable) {
            return response()->json([
                'available' => false,
                'message' => __('messages.api.errors.no_tables_available'),
            ]);
        }

        return response()->json([
            'available' => true,
            'table_id' => $availableTable->id,
            'table_code' => $availableTable->code,
            'capacity' => $availableTable->capacity,
        ]);
    }

    public function store(Request $request, ReservationService $reservationService)
    {
        $customer = $this->resolveCustomer($request);

        $validated = $request->validate([
            'location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'floor_id' => ['nullable', 'integer', 'exists:floors,id'],
            'table_id' => ['nullable', 'integer', 'exists:tables,id'],
            'reserved_for' => ['required', 'date_format:Y-m-d\TH:i'],
            'guest_count' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string'],
        ]);

        $reservedAt = Carbon::createFromFormat('Y-m-d\TH:i', $validated['reserved_for']);

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

        if (!$locationId) {
            abort(422, __('messages.api.errors.location_required_create'));
        }

        $guestCount = (int) $validated['guest_count'];

        // Delegate heavy logic to the Service
        $reservation = $reservationService->createReservation(
            $customer,
            $locationId,
            $reservedAt,
            $guestCount,
            $validated['table_id'] ?? null,
            $validated['notes'] ?? null
        );

        // Send reservation confirmation notification
        try {
            if ($customer->user) {
                $notificationService = app(NotificationService::class);
                $reservedAtDate = Carbon::parse($reservation->reservation_date . ' ' . $reservation->reservation_time);
                $notificationService->sendSystemNotification(
                    __('messages.api.reservations.notifications.customer_confirmed.title'),
                    __('messages.api.reservations.notifications.customer_confirmed.body', [
                        'count' => $reservation->guest_count,
                        'date' => $reservedAtDate->format('M d, Y'),
                        'time' => $reservedAtDate->format('g:i A'),
                        'code' => $reservation->code
                    ]),
                    $customer->user,
                    '/customer/reservations'
                );
            }
        } catch (\Exception $e) {
            \Log::warning('Failed to send reservation notification: ' . $e->getMessage());
        }

        return new ReservationResource($reservation->load(['table', 'customer.user', 'location']));
    }
}

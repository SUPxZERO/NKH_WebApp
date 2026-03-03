<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\DiningTable;
use App\Models\Reservation;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReservationService
{
    /**
     * Create a new reservation, finding an available table if none provided.
     *
     * @throws \Symfony\Component\HttpKernel\Exception\HttpException
     */
    public function createReservation(
        Customer $customer,
        int $locationId,
        Carbon $reservedAt,
        int $guestCount,
        ?int $tableId = null,
        ?string $notes = null
    ): Reservation {
        $reservationDate = $reservedAt->toDateString();
        $reservationTime = $reservedAt->format('H:i:s');

        return DB::transaction(function () use ($customer, $locationId, $reservationDate, $reservationTime, $guestCount, $tableId, $notes, $reservedAt) {
            $selectedTable = null;

            if ($tableId) {
                $selectedTable = DiningTable::with('floor')->findOrFail($tableId);

                // Verify table capacity
                if ($guestCount > (int) $selectedTable->capacity) {
                    abort(422, __('messages.api.errors.guest_limit'));
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
                    abort(409, __('messages.api.errors.table_reserved'));
                }
            } else {
                // Find best-fit table at this location
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

                    if (!$hasConflict) {
                        $selectedTable = $table;
                        break;
                    }
                }

                if (!$selectedTable) {
                    abort(409, __('messages.api.errors.no_tables_available'));
                }

                if ($guestCount > (int) $selectedTable->capacity) {
                    abort(422, __('messages.api.errors.guest_limit'));
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
                'notes' => $notes,
            ]);
        });
    }

    private function generateReservationNumber(int $locationId, Carbon $date): string
    {
        $attempts = 0;
        $maxAttempts = 10;

        do {
            $number = 'RES-' . $locationId . '-' . $date->format('Ymd') . '-' . str_pad((string) random_int(1, 9999), 4, '0', STR_PAD_LEFT);
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

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Reservation;
use App\Models\Customer;
use App\Models\DiningTable;
use App\Models\Location;
use Carbon\Carbon;
use Illuminate\Support\Str;

class ReservationSeeder extends Seeder
{
    public function run(): void
    {
        $customers = Customer::all();
        $tables = DiningTable::all();
        $locations = Location::all();
        
        // Create past reservations (last 2 months)
        $this->createPastReservations($customers, $tables, $locations);
        
        // Create future reservations (next 2 months)
        $this->createFutureReservations($customers, $tables, $locations);
    }

    private function createPastReservations($customers, $tables, $locations): void
    {
        $startDate = Carbon::now()->subMonths(2);
        $endDate = Carbon::now()->subDays(1);
        
        for ($i = 0; $i < 80; $i++) {
            $location = $locations->random();
            $customer = $customers->random();
            $locationTables = $tables->where('floor.location_id', $location->id);
            
            if ($locationTables->isEmpty()) continue;
            
            // Try to find a unique slot (avoid unique constraint violation)
            $attempts = 0;
            $maxAttempts = 10;
            $slotFound = false;

            do {
                $table = $locationTables->random();
                $reservationDate = $this->randomDateBetween($startDate, $endDate);
                $reservationTime = $this->getReservationTime();

                $exists = Reservation::where('location_id', $location->id)
                    ->where('table_id', $table->id)
                    ->where('reservation_date', $reservationDate->format('Y-m-d'))
                    ->where('reservation_time', $reservationTime)
                    ->exists();

                if (! $exists) {
                    $slotFound = true;
                    break;
                }

                $attempts++;
            } while ($attempts < $maxAttempts);

            if (! $slotFound) {
                // Couldn't find an available slot for this attempt, skip
                continue;
            }

            $reservationNumber = $this->generateReservationNumber($location->code, $reservationDate);

            // Ensure reservation code is unique (avoid unique constraint on code)
            $codeAttempts = 0;
            do {
                $code = substr(md5($reservationNumber . Str::random(8) . microtime(true)), 0, 20);
                $codeExists = Reservation::where('code', $code)->exists();
                $codeAttempts++;
            } while ($codeExists && $codeAttempts < 5);

            if ($codeExists) {
                // If we still couldn't generate a unique code, skip this reservation
                continue;
            }

            Reservation::create([
                'location_id' => $location->id,
                'customer_id' => $customer->id,
                'table_id' => $table->id,
                'code' => $code,
                'reservation_number' => $reservationNumber,
                'reserved_for' => $customer->full_name ?? $customer->name ?? "{$customer->first_name} {$customer->last_name}",
                'party_size' => rand(2, min(8, $table->capacity)),
                'reservation_date' => $reservationDate->format('Y-m-d'),
                'reservation_time' => $reservationTime,
                'status' => $this->getPastReservationStatus(),
                'special_requests' => $this->getSpecialRequests(),
                'notes' => $this->getReservationNotes(),
                'created_at' => $reservationDate->copy()->subDays(rand(1, 14)),
                'updated_at' => $reservationDate->copy()->addHours(rand(1, 6)),
            ]);
        }
    }

    private function createFutureReservations($customers, $tables, $locations): void
    {
        $startDate = Carbon::now()->addDay();
        $endDate = Carbon::now()->addMonths(2);
        
        for ($i = 0; $i < 60; $i++) {
            $location = $locations->random();
            $customer = $customers->random();
            $locationTables = $tables->where('floor.location_id', $location->id);
            
            if ($locationTables->isEmpty()) continue;
            
            // Try to find a unique slot (avoid unique constraint violation)
            $attempts = 0;
            $maxAttempts = 10;
            $slotFound = false;

            do {
                $table = $locationTables->random();
                $reservationDate = $this->randomDateBetween($startDate, $endDate);
                $reservationTime = $this->getReservationTime();

                $exists = Reservation::where('location_id', $location->id)
                    ->where('table_id', $table->id)
                    ->where('reservation_date', $reservationDate->format('Y-m-d'))
                    ->where('reservation_time', $reservationTime)
                    ->exists();

                if (! $exists) {
                    $slotFound = true;
                    break;
                }

                $attempts++;
            } while ($attempts < $maxAttempts);

            if (! $slotFound) {
                // Couldn't find an available slot for this attempt, skip
                continue;
            }

            $reservationNumber = $this->generateReservationNumber($location->code, $reservationDate);

            // Ensure reservation code is unique (avoid unique constraint on code)
            $codeAttempts = 0;
            do {
                $code = substr(md5($reservationNumber . Str::random(8) . microtime(true)), 0, 20);
                $codeExists = Reservation::where('code', $code)->exists();
                $codeAttempts++;
            } while ($codeExists && $codeAttempts < 5);

            if ($codeExists) {
                // If we still couldn't generate a unique code, skip this reservation
                continue;
            }

            Reservation::create([
                'location_id' => $location->id,
                'customer_id' => $customer->id,
                'table_id' => $table->id,
                'code' => $code,
                'reservation_number' => $reservationNumber,
                'reserved_for' => $customer->full_name ?? $customer->name ?? "{$customer->first_name} {$customer->last_name}",
                'party_size' => rand(2, min(8, $table->capacity)),
                'reservation_date' => $reservationDate->format('Y-m-d'),
                'reservation_time' => $reservationTime,
                'status' => $this->getFutureReservationStatus(),
                'special_requests' => $this->getSpecialRequests(),
                'notes' => $this->getReservationNotes(),
                'created_at' => now()->subDays(rand(0, 7)),
                'updated_at' => now()->subDays(rand(0, 3)),
            ]);
        }
    }

    private function randomDateBetween(Carbon $start, Carbon $end): Carbon
    {
        $timestamp = rand($start->timestamp, $end->timestamp);
        return Carbon::createFromTimestamp($timestamp);
    }

    private function getReservationTime(): string
    {
        $times = [
            '11:30:00', '12:00:00', '12:30:00', '13:00:00', '13:30:00',
            '18:00:00', '18:30:00', '19:00:00', '19:30:00', '20:00:00', '20:30:00'
        ];
        
        return $times[array_rand($times)];
    }

    private function generateReservationNumber(string $locationCode, Carbon $date): string
    {
        $attempts = 0;
        $maxAttempts = 10;

        do {
            $number = 'RES-' . $locationCode . '-' . $date->format('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
            $exists = Reservation::where('reservation_number', $number)->exists();
            $attempts++;
        } while ($exists && $attempts < $maxAttempts);

        return $number;
    }

    private function getPastReservationStatus(): string
    {
        $statuses = ['completed', 'completed', 'completed', 'completed', 'no_show', 'cancelled'];
        return $statuses[array_rand($statuses)];
    }

    private function getFutureReservationStatus(): string
    {
        $statuses = ['confirmed', 'confirmed', 'confirmed', 'pending', 'cancelled'];
        return $statuses[array_rand($statuses)];
    }

    private function getSpecialRequests(): ?string
    {
        $requests = [
            null, null, null, null, // 40% no special requests
            'Birthday celebration',
            'Anniversary dinner',
            'Business meeting',
            'Wheelchair accessible table',
            'Quiet table please',
            'Window seat preferred',
            'High chair needed',
            'Vegetarian menu',
            'No allergens please',
            'Surprise dessert',
            'Private dining area',
            'Early arrival possible',
        ];
        
        return $requests[array_rand($requests)];
    }

    private function getReservationNotes(): ?string
    {
        $notes = [
            null, null, null, null, null, // 50% no notes
            'Regular customer',
            'First time visitor',
            'VIP guest',
            'Corporate booking',
            'Group reservation',
            'Special occasion',
            'Dietary restrictions noted',
            'Confirmed by phone',
            'Online booking',
            'Walk-in converted to reservation',
        ];
        
        return $notes[array_rand($notes)];
    }
}

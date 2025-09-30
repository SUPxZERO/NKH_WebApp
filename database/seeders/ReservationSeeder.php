<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Reservation;
use App\Models\Customer;
use App\Models\DiningTable;
use App\Models\Location;
use Carbon\Carbon;

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
            
            $table = $locationTables->random();
            $reservationDate = $this->randomDateBetween($startDate, $endDate);
            $reservationTime = $this->getReservationTime();
            
            Reservation::create([
                'location_id' => $location->id,
                'customer_id' => $customer->id,
                'table_id' => $table->id,
                'reservation_number' => $this->generateReservationNumber($location->code, $reservationDate),
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
            
            $table = $locationTables->random();
            $reservationDate = $this->randomDateBetween($startDate, $endDate);
            $reservationTime = $this->getReservationTime();
            
            Reservation::create([
                'location_id' => $location->id,
                'customer_id' => $customer->id,
                'table_id' => $table->id,
                'reservation_number' => $this->generateReservationNumber($location->code, $reservationDate),
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
        return 'RES-' . $locationCode . '-' . $date->format('Ymd') . '-' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
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

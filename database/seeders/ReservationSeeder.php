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
        
        if ($customers->isEmpty() || $tables->isEmpty() || $locations->isEmpty()) {
            $this->command->warn('Missing dependencies (Customers, Tables, or Locations). Skipping Reservation seeding.');
            return;
        }

        // Create past reservations (last 2 months)
        $this->command->info('Creating past reservations...');
        for ($i = 0; $i < 40; $i++) {
            $location = $locations->random();
            // Find tables for this location
            $availableTables = $tables->where('floor.location_id', $location->id);
            if ($availableTables->isEmpty()) {
                // Fallback to random table if strict location matching fails in basic seed
                 $availableTables = $tables; 
            }
            
            Reservation::factory()
                ->past()
                ->create([
                    'location_id' => $location->id,
                    'customer_id' => $customers->random()->id,
                    'table_id' => $availableTables->random()->id,
                ]);
        }
        
        // Create future reservations (next 2 months)
        $this->command->info('Creating future reservations...');
        for ($i = 0; $i < 30; $i++) {
            $location = $locations->random();
            $availableTables = $tables->where('floor.location_id', $location->id);
            if ($availableTables->isEmpty()) {
                 $availableTables = $tables;
            }

            Reservation::factory()
                ->future()
                ->create([
                    'location_id' => $location->id,
                    'customer_id' => $customers->random()->id,
                    'table_id' => $availableTables->random()->id,
                ]);
        }
    }

}

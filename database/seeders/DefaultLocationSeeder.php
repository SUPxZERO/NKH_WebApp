<?php

namespace Database\Seeders;

use App\Models\Location;
use Illuminate\Database\Seeder;

class DefaultLocationSeeder extends Seeder
{
    public function run(): void
    {
        Location::firstOrCreate(
            ['code' => 'MAIN'],
            [
                'name' => 'Main Branch',
                'address_line1' => '123 Main St',
                'city' => 'Phnom Penh',
                'state' => 'Phnom Penh',
                'postal_code' => '12000',
                'country' => 'Cambodia',
                'phone' => '+855 12 345 678',
                'is_active' => true,
                'accepts_online_orders' => true,
                'accepts_pickup' => true,
                'accepts_delivery' => true,
            ]
        );
    }
}

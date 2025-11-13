<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Location;

class LocationSeeder extends Seeder
{
    public function run(): void
    {
        $locations = [
            [
                'code' => 'NKH-DT',
                'name' => 'NKH Downtown Flagship',
                'address_line1' => '123 Main Street',
                'address_line2' => 'Downtown District',
                'city' => 'Phnom Penh',
                'state' => 'Phnom Penh',
                'postal_code' => '12000',
                'country' => 'Cambodia',
                'phone' => '+855-23-123-456',
                'is_active' => true,
                'accepts_online_orders' => true,
                'accepts_pickup' => true,
                'accepts_delivery' => true,
            ],
            // [
            //     'code' => 'NKH-SR',
            //     'name' => 'NKH Siem Reap Branch',
            //     'address_line1' => '456 Pub Street',
            //     'address_line2' => 'Old Market Area',
            //     'city' => 'Siem Reap',
            //     'state' => 'Siem Reap',
            //     'postal_code' => '17000',
            //     'country' => 'Cambodia',
            //     'phone' => '+855-63-789-012',
            //     'is_active' => true,
            //     'accepts_online_orders' => true,
            //     'accepts_pickup' => true,
            //     'accepts_delivery' => true,
            // ],
            // [
            //     'code' => 'NKH-BB',
            //     'name' => 'NKH Battambang Mall',
            //     'address_line1' => '789 Mall Plaza',
            //     'address_line2' => 'Level 2',
            //     'city' => 'Battambang',
            //     'state' => 'Battambang',
            //     'postal_code' => '02000',
            //     'country' => 'Cambodia',
            //     'phone' => '+855-53-345-678',
            //     'is_active' => true,
            //     'accepts_online_orders' => true,
            //     'accepts_pickup' => true,
            //     'accepts_delivery' => false,
            // ],
            // [
            //     'code' => 'NKH-KP',
            //     'name' => 'NKH Kampot Riverside',
            //     'address_line1' => '321 Riverside Road',
            //     'address_line2' => 'Kampot Center',
            //     'city' => 'Kampot',
            //     'state' => 'Kampot',
            //     'postal_code' => '07000',
            //     'country' => 'Cambodia',
            //     'phone' => '+855-33-901-234',
            //     'is_active' => true,
            //     'accepts_online_orders' => true,
            //     'accepts_pickup' => true,
            //     'accepts_delivery' => true,
            // ],
        ];

        foreach ($locations as $location) {
            Location::create($location);
        }
    }
}

<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\Location;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CustomerAddressesSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure a location exists
        $location = Location::first();
        if (!$location) {
            $location = Location::create([
                'code' => 'MAIN',
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
            ]);
        }

        // Create a sample user to represent a customer
        $user = User::firstOrCreate(
            ['email' => 'customer@example.com'],
            [
                'name' => 'Sample Customer',
                'password' => Hash::make('password'),
                'phone' => '+855 98 765 432',
                'default_location_id' => $location->id,
                'is_active' => true,
            ]
        );

        // Create the Customer profile if missing
        $customer = Customer::firstOrCreate(
            ['user_id' => $user->id],
            [
                'preferred_location_id' => $location->id,
                'gender' => 'other',
                'points_balance' => 0,
            ]
        );

        // Seed two addresses (Home, Work)
        CustomerAddress::updateOrCreate(
            [
                'customer_id' => $customer->id,
                'label' => 'Home',
            ],
            [
                'address_line_1' => 'No. 45, Street 123',
                'address_line_2' => 'Sangkat Boeung Keng Kang',
                'city' => 'Phnom Penh',
                'province' => 'Phnom Penh',
                'postal_code' => '12345',
                'latitude' => 11.5564,
                'longitude' => 104.9282,
                'delivery_instructions' => 'Leave at the front desk.',
            ]
        );

        CustomerAddress::updateOrCreate(
            [
                'customer_id' => $customer->id,
                'label' => 'Work',
            ],
            [
                'address_line_1' => 'Tower A, 12th Floor',
                'address_line_2' => 'Russian Blvd',
                'city' => 'Phnom Penh',
                'province' => 'Phnom Penh',
                'postal_code' => '12000',
                'latitude' => 11.5621,
                'longitude' => 104.8885,
                'delivery_instructions' => 'Call upon arrival.',
            ]
        );
    }
}

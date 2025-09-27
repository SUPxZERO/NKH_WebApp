<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Database\Seeders\OperatingHoursSeeder;
use Database\Seeders\OrderTimeSlotsSeeder;
use Database\Seeders\CustomerAddressesSeeder;
use Database\Seeders\DefaultLocationSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Database\Seeders\PaymentMethodsSeeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
            ]
        );

        $this->call([
            // Baseline system data
            DefaultLocationSeeder::class,
            RolesAndPermissionsSeeder::class,
            PaymentMethodsSeeder::class,

            // Online ordering support
            OperatingHoursSeeder::class,
            OrderTimeSlotsSeeder::class,
            CustomerAddressesSeeder::class,
        ]);
    }
}

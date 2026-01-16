<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Order;
use App\Models\Customer;
use App\Models\DiningTable;
use App\Models\Location;
use Carbon\Carbon;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure dependencies exist
        if (\App\Models\Customer::count() === 0) \App\Models\Customer::factory(10)->create();
        if (\App\Models\DiningTable::count() === 0) \App\Models\DiningTable::factory(10)->create();
        if (\App\Models\Location::count() === 0) \App\Models\Location::factory(1)->create();
        if (\App\Models\OrderType::count() === 0) \Database\Seeders\OrderTypeSeeder::class; 
        
        $this->command->info('Creating 50 random orders with items and invoices...');

        // Create 30 PAID orders with paid invoices
        \App\Models\Order::factory()
            ->count(30)
            ->has(\App\Models\Invoice::factory()->paid(), 'invoice')
            ->create([
                'customer_id' => \App\Models\Customer::inRandomOrder()->first()->id,
                'location_id' => \App\Models\Location::inRandomOrder()->first()->id,
                'payment_status' => 'paid', // Explicitly set order status to paid
            ]);

        // Create 20 UNPAID orders with issued invoices
        \App\Models\Order::factory()
            ->count(20)
            ->has(\App\Models\Invoice::factory(), 'invoice')
            ->create([
                'customer_id' => \App\Models\Customer::inRandomOrder()->first()->id,
                'location_id' => \App\Models\Location::inRandomOrder()->first()->id,
                'payment_status' => 'unpaid',
            ]);

        // Create some orders for Telegram users (Guest scenario) - Mixed paid/unpaid
        $this->command->info('Creating 10 Telegram guest orders...');
        if (\App\Models\TelegramUser::exists()) {
             // 5 Paid Guest Orders
             \App\Models\Order::factory()
                ->count(5)
                ->has(\App\Models\Invoice::factory()->paid(), 'invoice')
                ->create([
                    'customer_id' => null,
                    'telegram_user_id' => \App\Models\TelegramUser::inRandomOrder()->first()->id,
                    'location_id' => \App\Models\Location::inRandomOrder()->first()->id,
                    'payment_status' => 'paid',
                ]);

             // 5 Unpaid Guest Orders
             \App\Models\Order::factory()
                ->count(5)
                ->has(\App\Models\Invoice::factory(), 'invoice')
                ->create([
                    'customer_id' => null,
                    'telegram_user_id' => \App\Models\TelegramUser::inRandomOrder()->first()->id,
                    'location_id' => \App\Models\Location::inRandomOrder()->first()->id,
                    'payment_status' => 'unpaid',
                ]);
        }
        
    }
}

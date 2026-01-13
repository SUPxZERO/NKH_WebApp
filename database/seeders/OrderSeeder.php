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

        // Create orders with items and invoices
        \App\Models\Order::factory()
            ->count(50)
            ->has(\App\Models\OrderItem::factory()->count(3), 'items') // Create 3 items per order
            ->has(\App\Models\Invoice::factory(), 'invoice')           // Create an invoice
            ->create([
                'customer_id' => \App\Models\Customer::inRandomOrder()->first()->id,
                'location_id' => \App\Models\Location::inRandomOrder()->first()->id,
            ]);

        // Create some orders for Telegram users (Guest scenario)
        $this->command->info('Creating 10 Telegram guest orders...');
        if (\App\Models\TelegramUser::exists()) {
             \App\Models\Order::factory()
                ->count(10)
                ->has(\App\Models\OrderItem::factory()->count(2), 'items')
                ->create([
                    'customer_id' => null,
                    'telegram_user_id' => \App\Models\TelegramUser::inRandomOrder()->first()->id,
                    'location_id' => \App\Models\Location::inRandomOrder()->first()->id,
                ]);
        }
        
    }
}

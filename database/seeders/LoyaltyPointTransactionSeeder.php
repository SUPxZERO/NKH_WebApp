<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LoyaltyPoint;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Location;
use Carbon\Carbon;

class LoyaltyPointTransactionSeeder extends Seeder
{
    public function run(): void
    {
        $customers = Customer::all();
        $locations = Location::all();
        if ($customers->isEmpty() || $locations->isEmpty()) return;

        // Generate historical transactions (last 60 days)
        for ($i = 0; $i < 150; $i++) {
            $customer = $customers->random();
            $location = $locations->random();
            $occurredAt = Carbon::now()->subDays(rand(0, 60))->subMinutes(rand(0, 1440));

            $type = ['earn','earn','earn','redeem','adjust'][array_rand(['earn','earn','earn','redeem','adjust'])];
            $points = match ($type) {
                'earn' => rand(5, 50),
                'redeem' => -rand(5, 40),
                'adjust' => rand(-10, 10),
            };

            $last = LoyaltyPoint::where('customer_id', $customer->id)
                ->orderByDesc('occurred_at')
                ->orderByDesc('id')
                ->first();
            $prev = $last?->balance_after ?? 0;

            // Optionally link to a completed order
            $order = Order::where('customer_id', $customer->id)
                ->whereIn('status', ['completed','ready'])
                ->inRandomOrder()
                ->first();

            LoyaltyPoint::create([
                'customer_id' => $customer->id,
                'order_id' => $order?->id,
                'location_id' => $location->id,
                'type' => $type,
                'points' => $points,
                'balance_after' => $prev + $points,
                'occurred_at' => $occurredAt,
                'notes' => null,
            ]);
        }
    }
}

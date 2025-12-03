<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Customer;
use App\Models\LoyaltyPoint;
use App\Models\Order;
use Carbon\Carbon;

class LoyaltyPointsUpdateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Starting Loyalty Points Update...');

        // Get all customers
        $customers = Customer::all();

        foreach ($customers as $customer) {
            $this->command->info("Processing Customer ID: {$customer->id}");

            // Calculate total from existing loyalty points
            $existingPoints = LoyaltyPoint::where('customer_id', $customer->id)->sum('points');
            
            // Get customer's completed orders
            $completedOrders = Order::where('customer_id', $customer->id)
                ->whereIn('status', ['completed', 'delivered'])
                ->get();

            $earnedFromOrders = 0;

            // Award points for each completed order (1 point per dollar spent)
            foreach ($completedOrders as $order) {
                $orderPoints = floor($order->total_amount); // 1 point per $1
                
                // Check if we already have a loyalty point record for this order
                $existingOrderPoints = LoyaltyPoint::where('customer_id', $customer->id)
                    ->where('order_id', $order->id)
                    ->where('type', 'earn')
                    ->exists();

                if (!$existingOrderPoints && $orderPoints > 0) {
                    // Create loyalty point record
                    LoyaltyPoint::create([
                        'customer_id' => $customer->id,
                        'order_id' => $order->id,
                        'location_id' => $order->location_id,
                        'type' => 'earn',
                        'points' => $orderPoints,
                        'balance_after' => 0, // Will update after
                        'occurred_at' => $order->created_at ?? now(),
                        'notes' => "Points earned from Order #{$order->id}",
                    ]);

                    $earnedFromOrders += $orderPoints;
                    $this->command->info("  + Added {$orderPoints} points for Order #{$order->id}");
                }
            }

            // Add bonus welcome points if customer has no loyalty transactions
            $loyaltyCount = LoyaltyPoint::where('customer_id', $customer->id)->count();
            
            if ($loyaltyCount === 0) {
                // Give welcome bonus
                LoyaltyPoint::create([
                    'customer_id' => $customer->id,
                    'location_id' => $customer->preferred_location_id,
                    'type' => 'earn',
                    'points' => 100,
                    'balance_after' => 100,
                    'occurred_at' => $customer->created_at ?? now(),
                    'notes' => 'Welcome bonus points',
                ]);
                $this->command->info("  + Added 100 welcome bonus points");
            } elseif ($completedOrders->count() > 0 && $earnedFromOrders === 0) {
                // Customer has orders but no automatic points, give them bonus
                $bonusPoints = min(500, $completedOrders->count() * 50);
                LoyaltyPoint::create([
                    'customer_id' => $customer->id,
                    'location_id' => $customer->preferred_location_id,
                    'type' => 'earn',
                    'points' => $bonusPoints,
                    'balance_after' => 0,
                    'occurred_at' => now(),
                    'notes' => 'Loyalty appreciation bonus',
                ]);
                $this->command->info("  + Added {$bonusPoints} appreciation bonus points");
            }

            // Recalculate balance_after for all points chronologically
            $allPoints = LoyaltyPoint::where('customer_id', $customer->id)
                ->orderBy('occurred_at')
                ->orderBy('id')
                ->get();

            $runningBalance = 0;
            foreach ($allPoints as $point) {
                $runningBalance += $point->points;
                $point->balance_after = $runningBalance;
                $point->save();
            }

            // Update customer's points_balance
            $finalBalance = LoyaltyPoint::where('customer_id', $customer->id)
                ->orderBy('occurred_at', 'desc')
                ->orderBy('id', 'desc')
                ->first();

            $customer->points_balance = $finalBalance ? $finalBalance->balance_after : 0;
            
            // Ensure non-negative balance
            if ($customer->points_balance < 0) {
                // Add adjustment to bring to positive
                $adjustmentPoints = abs($customer->points_balance) + 200;
                LoyaltyPoint::create([
                    'customer_id' => $customer->id,
                    'location_id' => $customer->preferred_location_id,
                    'type' => 'adjust',
                    'points' => $adjustmentPoints,
                    'balance_after' => 200,
                    'occurred_at' => now(),
                    'notes' => 'Balance adjustment - loyalty recovery',
                ]);
                $customer->points_balance = 200;
                $this->command->info("  + Added {$adjustmentPoints} adjustment points");
            }

            $customer->save();

            $this->command->info("  Final Balance: {$customer->points_balance} points");
            $this->command->info('');
        }

        $this->command->info('✅ Loyalty Points Update Complete!');
        
        // Show summary
        $totalCustomers = Customer::count();
        $customersWithPoints = Customer::where('points_balance', '>', 0)->count();
        $totalPointsInSystem = Customer::sum('points_balance');
        
        $this->command->info('');
        $this->command->info('Summary:');
        $this->command->info("  Total Customers: {$totalCustomers}");
        $this->command->info("  Customers with Points: {$customersWithPoints}");
        $this->command->info("  Total Points in System: {$totalPointsInSystem}");
    }
}

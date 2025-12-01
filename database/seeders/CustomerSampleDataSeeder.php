<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\MenuItem;
use App\Models\LoyaltyPoint;
use App\Models\Reservation;
use App\Models\DiningTable;
use App\Models\Location;
use Carbon\Carbon;

class CustomerSampleDataSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::first();
        $customer = Customer::where('user_id', $user->id)->first();
        
        if (!$customer) {
            $this->command->error('No customer found for user');
            return;
        }

        $location = Location::first();
        if (!$location) {
            $this->command->error('No location found');
            return;
        }

        // Get some menu items
        $menuItems = MenuItem::where('is_active', true)->limit(8)->get();
        
        if ($menuItems->count() < 1) {
            $this->command->error('No active menu items found');
            return;
        }

        // Create 5 sample orders (3 delivered, 1 completed, 1 in progress)
        $this->command->info('Creating sample orders...');
        
        $orderStatuses = [
            ['status' => 'completed', 'days_ago' => 30, 'total' => 45.50],
            ['status' => 'completed', 'days_ago' => 20, 'total' => 78.00],
            ['status' => 'completed', 'days_ago' => 10, 'total' => 125.00],
            ['status' => 'completed', 'days_ago' => 5, 'total' => 92.50],
            ['status' => 'preparing', 'days_ago' => 0, 'total' => 56.25],
        ];

        foreach ($orderStatuses as $index => $orderData) {
            $orderDate = Carbon::now()->subDays($orderData['days_ago']);
            
            $order = Order::create([
                'customer_id' => $customer->id,
                'location_id' => $location->id,
                'order_number' => 'ORD-' . strtoupper(substr(md5($customer->id . $index), 0, 8)),
                'status' => $orderData['status'],
                'order_type' => $index % 2 === 0 ? 'dine-in' : 'takeaway',
                'subtotal' => $orderData['total'] * 0.85,
                'tax_amount' => $orderData['total'] * 0.10,
                'total_amount' => $orderData['total'],
                'payment_status' => 'paid',
                'ordered_at' => $orderDate,
                'approved_at' => $orderDate->copy()->addMinutes(5),
                'approval_status' => 'approved',
                'is_auto_approved' => true,
                'created_at' => $orderDate,
                'updated_at' => $orderDate,
            ]);

            // Add 2-4 items to each order
            $itemCount = rand(2, 4);
            $itemsToAdd = $menuItems->random(min($itemCount, $menuItems->count()));
            
            foreach ($itemsToAdd as $menuItem) {
                $qty = rand(1, 3);
                $price = rand(10, 30);
                
                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_item_id' => $menuItem->id,
                    'quantity' => $qty,
                    'unit_price' => $price,
                    'total_price' => $price * $qty,
                    'created_at' => $orderDate,
                    'updated_at' => $orderDate,
                ]);
            }

            // Add loyalty points for delivered/completed orders
            if (in_array($orderData['status'], ['delivered', 'completed'])) {
                $points = floor($orderData['total'] / 2); // $2 spent = 1 point
                
                LoyaltyPoint::create([
                    'customer_id' => $customer->id,
                    'type' => 'earn',
                    'points' => $points,
                    'reference_type' => 'App\\Models\\Order',
                    'reference_id' => $order->id,
                    'description' => "Earned from order #{$order->order_number}",
                    'occurred_at' => $orderDate->addMinutes(30),
                    'created_at' => $orderDate->addMinutes(30),
                    'updated_at' => $orderDate->addMinutes(30),
                ]);
                
                $this->command->info("  Added {$points} loyalty points for order #{$order->order_number}");
            }
        }

        $this->command->info('Created 5 sample orders with items');

        // Create a sample reservation
        $this->command->info('Creating sample reservation...');
        
        $table = DiningTable::whereHas('floor', function($q) use ($location) {
            $q->where('location_id', $location->id);
        })->first();

        if ($table) {
            $reservationDate = Carbon::now()->addDays(3)->setTime(19, 0);
            
            Reservation::create([
                'customer_id' => $customer->id,
                'location_id' => $location->id,
                'table_id' => $table->id,
                'code' => 'RES-' . strtoupper(substr(md5($customer->id . 'res'), 0, 8)),
                'reservation_number' => 'RES-' . date('Ymd') . '-001',
                'reservation_date' => $reservationDate->toDateString(),
                'reservation_time' => $reservationDate->toTimeString(),
                'party_size' => 4,
                'status' => 'confirmed',
                'special_requests' => 'Window seat if possible, celebrating anniversary',
                'confirmed_at' => Carbon::now(),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
            
            $this->command->info('Created upcoming reservation for ' . $reservationDate->format('Y-m-d H:i'));
        }

        $this->command->info('✅ Sample data created successfully!');
        $this->command->info('   - 5 Orders');
        $this->command->info('   - Loyalty points transactions');
        $this->command->info('   - 1 Upcoming reservation');
    }
}

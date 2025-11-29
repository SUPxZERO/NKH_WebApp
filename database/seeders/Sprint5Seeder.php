<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\MenuItem;
use App\Models\User;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\InventoryTransaction;
use App\Models\Ingredient;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class Sprint5Seeder extends Seeder
{
    public function run(): void
    {
        $this->seedOrders();
        $this->seedExpenses();
        $this->seedInventoryTransactions();
    }

    private function seedOrders()
    {
        $menuItems = DB::table('menu_items')->get();
        $this->command->info('Found ' . $menuItems->count() . ' menu items.');
        
        $customers = Customer::all();
        $locations = \App\Models\Location::all();
        
        if ($menuItems->count() == 0) {
            $this->command->warn('No menu items found. Run MenuItemSeeder first.');
            return;
        }

        if ($locations->count() == 0) {
            $this->command->warn('No locations found. Run LocationSeeder first.');
            return;
        }

        // Generate orders for the last 30 days
        $startDate = Carbon::now()->subDays(30);
        $endDate = Carbon::now();
        
        // Check if Sprint5 orders already exist
        $existingCount = Order::where('order_number', 'like', 'ORD-%')->count();
        if ($existingCount > 0) {
            $this->command->warn('Sprint5 orders already exist. Skipping order seeding.');
            return;
        }

        $orders = [];
        $orderItems = [];
        $orderIdCounter = Order::max('id') + 1;

        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            // Random number of orders per day (10-30)
            $dailyOrders = rand(10, 30);
            
            // Weekend boost
            if ($date->isWeekend()) {
                $dailyOrders += rand(5, 15);
            }

            for ($i = 0; $i < $dailyOrders; $i++) {
                // Generate time based on peak hours (12-2pm, 6-9pm)
                $hour = $this->getWeightedHour();
                $orderTime = $date->copy()->setTime($hour, rand(0, 59));

                $orderTotal = 0;
                $itemsCount = rand(1, 4);
                $currentOrderId = $orderIdCounter++;
                $location = $locations->random();

                // Create Order Items
                for ($j = 0; $j < $itemsCount; $j++) {
                    $item = $menuItems->random();
                    $quantity = rand(1, 2);
                    $price = $item->price;
                    $itemTotal = $price * $quantity;
                    
                    $orderItems[] = [
                        'order_id' => $currentOrderId,
                        'menu_item_id' => $item->id,
                        'quantity' => $quantity,
                        'unit_price' => $price,
                        'discount_amount' => 0,
                        'tax_amount' => $itemTotal * 0.1, // 10% tax
                        'total_price' => $itemTotal * 1.1,
                        'status' => 'served',
                        'special_instructions' => '',
                        'created_at' => $orderTime,
                        'updated_at' => $orderTime,
                    ];

                    $orderTotal += $itemTotal * 1.1;
                }

                $orders[] = [
                    'id' => $currentOrderId,
                    'location_id' => $location->id,
                    'order_number' => 'ORD-' . $date->format('Ymd') . '-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                    'customer_id' => $customers->count() > 0 ? $customers->random()->id : null,
                    'table_id' => null,
                    'status' => 'completed',
                    'payment_status' => 'paid',
                    'subtotal' => $orderTotal / 1.1,
                    'tax_amount' => $orderTotal - ($orderTotal / 1.1),
                    'discount_amount' => 0,
                    'service_charge' => 0,
                    'total_amount' => $orderTotal,
                    'currency' => 'USD',
                    'order_type' => 'delivery',
                    'ordered_at' => $orderTime,
                    'completed_at' => $orderTime->copy()->addMinutes(rand(30, 90)),
                    'special_instructions' => '',
                    'created_at' => $orderTime,
                    'updated_at' => $orderTime,
                ];
            }
        }

        // Batch insert orders
        foreach (array_chunk($orders, 50) as $chunk) {
            Order::insert($chunk);
        }

        // Batch insert order items
        foreach (array_chunk($orderItems, 100) as $chunk) {
            OrderItem::insert($chunk);
        }

        $this->command->info('Seeded ' . count($orders) . ' orders.');
    }

    private function seedExpenses()
    {
        $locations = \App\Models\Location::all();
        if ($locations->count() == 0) return;

        // Get first location to use for categories
        $location = $locations->first();

        // Ensure categories exist
        $categories = [
            'Rent' => 2000,
            'Utilities' => 500,
            'Salaries' => 5000,
            'Maintenance' => 300,
            'Marketing' => 400,
            'Supplies' => 800
        ];

        $expenseCats = [];
        foreach ($categories as $name => $baseAmount) {
            $expenseCats[$name] = ExpenseCategory::firstOrCreate(
                ['name' => $name, 'location_id' => $location->id],
                ['description' => $name . ' expenses', 'is_active' => true]
            );
        }

        $expenses = [];
        $startDate = Carbon::now()->subDays(30);
        $endDate = Carbon::now();

        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            $location = $locations->random();
            
            // Daily expenses (Supplies, Marketing)
            if (rand(0, 1)) {
                $expenses[] = [
                    'location_id' => $location->id,
                    'expense_category_id' => $expenseCats['Supplies']->id,
                    'amount' => rand(50, 200),
                    'description' => 'Daily supplies',
                    'expense_date' => $date->format('Y-m-d'),
                    'vendor_name' => 'Local Supplier',
                    'status' => 'approved',
                    'created_at' => $date,
                    'updated_at' => $date,
                ];
            }

            // Weekly expenses (Maintenance)
            if ($date->isFriday()) {
                $expenses[] = [
                    'location_id' => $location->id,
                    'expense_category_id' => $expenseCats['Maintenance']->id,
                    'amount' => rand(200, 500),
                    'description' => 'Weekly maintenance',
                    'expense_date' => $date->format('Y-m-d'),
                    'vendor_name' => 'FixIt All',
                    'status' => 'approved',
                    'created_at' => $date,
                    'updated_at' => $date,
                ];
            }

            // Monthly expenses (Rent, Salaries) - on the 1st
            if ($date->day == 1) {
                $expenses[] = [
                    'location_id' => $location->id,
                    'expense_category_id' => $expenseCats['Rent']->id,
                    'amount' => 2000,
                    'description' => 'Monthly Rent',
                    'expense_date' => $date->format('Y-m-d'),
                    'vendor_name' => 'Landlord Inc',
                    'status' => 'approved',
                    'created_at' => $date,
                    'updated_at' => $date,
                ];
                $expenses[] = [
                    'location_id' => $location->id,
                    'expense_category_id' => $expenseCats['Salaries']->id,
                    'amount' => 5000 + rand(0, 500), // Variable OT
                    'description' => 'Staff Salaries',
                    'expense_date' => $date->format('Y-m-d'),
                    'vendor_name' => 'Payroll',
                    'status' => 'approved',
                    'created_at' => $date,
                    'updated_at' => $date,
                ];
            }
        }

        foreach (array_chunk($expenses, 50) as $chunk) {
            Expense::insert($chunk);
        }

        $this->command->info('Seeded ' . count($expenses) . ' expenses.');
    }

    private function seedInventoryTransactions()
    {
        // Skip for now - inventory transactions have complex enum requirements
        $this->command->info('Skipping inventory transactions (optional for analytics).');
        return;
        
        $ingredients = Ingredient::all();
        $locations = \App\Models\Location::all();
        if ($ingredients->count() == 0 || $locations->count() == 0) return;

        $transactions = [];
        $startDate = Carbon::now()->subDays(30);
        $endDate = Carbon::now();

        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            // Simulate daily usage for random ingredients
            $dailyIngredients = $ingredients->random(min($ingredients->count(), 10));
            $location = $locations->random();
            
            foreach ($dailyIngredients as $ingredient) {
                $usage = rand(1, 5);
                $transactions[] = [
                    'location_id' => $location->id,
                    'ingredient_id' => $ingredient->id,
                    'type' => 'usage',
                    'quantity' => $usage,
                    'unit_cost' => $ingredient->cost_per_unit ?? 0,
                    'value' => $usage * ($ingredient->cost_per_unit ?? 0),
                    'notes' => 'Daily consumption - ' . $date->format('Y-m-d'),
                    'transacted_at' => $date,
                    'created_at' => $date,
                    'updated_at' => $date,
                ];
            }
        }

        foreach (array_chunk($transactions, 100) as $chunk) {
            InventoryTransaction::insert($chunk);
        }

        $this->command->info('Seeded ' . count($transactions) . ' inventory transactions.');
    }

    private function getWeightedHour()
    {
        $rand = rand(1, 100);
        if ($rand <= 40) return rand(18, 21); // 40% Dinner peak (6-9pm)
        if ($rand <= 70) return rand(12, 14); // 30% Lunch peak (12-2pm)
        return rand(10, 22); // 30% Other times
    }
}

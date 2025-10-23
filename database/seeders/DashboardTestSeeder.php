<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Order;
use App\Models\Customer;
use App\Models\MenuItem;
use App\Models\Category;
use App\Models\Employee;
use App\Models\DiningTable;
use App\Models\Expense;
use App\Models\CustomerRequest;
use App\Models\Reservation;
use App\Models\CategoryTranslation;
use Carbon\Carbon;

class DashboardTestSeeder extends Seeder
{
    public function run(): void
    {
        // Create test categories
        $categories = ['Main Course', 'Appetizers', 'Desserts', 'Beverages'];
        foreach ($categories as $categoryName) {
            $category = Category::create([
                'slug' => strtolower(str_replace(' ', '-', $categoryName)),
                'is_active' => true,
                'display_order' => 0,
            ]);
            
            CategoryTranslation::create([
                'category_id' => $category->id,
                'locale' => 'en',
                'name' => $categoryName,
                'description' => "Description for {$categoryName}"
            ]);

            // Create menu items for each category
            for ($i = 1; $i <= 5; $i++) {
                MenuItem::create([
                    'category_id' => $category->id,
                    'name' => "{$categoryName} Item {$i}",
                    'price' => rand(500, 3000) / 100,
                    'is_active' => true,
                    'display_order' => $i,
                ]);
            }
        }

        // Create employees
        for ($i = 1; $i <= 10; $i++) {
            Employee::create([
                'name' => "Employee {$i}",
                'email' => "employee{$i}@example.com",
                'phone' => "123456789{$i}",
                'status' => $i <= 8 ? 'active' : 'inactive',
            ]);
        }

        // Create tables
        for ($i = 1; $i <= 20; $i++) {
            DiningTable::create([
                'name' => "Table {$i}",
                'capacity' => rand(2, 8),
                'status' => $i <= 15 ? 'available' : 'occupied',
            ]);
        }

        // Create customers and orders for the last 30 days
        $menuItems = MenuItem::all();
        $startDate = Carbon::now()->subDays(30);
        $dates = [];
        
        for ($i = 0; $i < 30; $i++) {
            $dates[] = $startDate->copy()->addDays($i);
        }

        foreach ($dates as $date) {
            // Create 3-8 orders for each day
            $orderCount = rand(3, 8);
            
            for ($i = 0; $i < $orderCount; $i++) {
                $customer = Customer::create([
                    'name' => "Customer {$date->format('Y-m-d')} {$i}",
                    'email' => "customer_{$date->format('Ymd')}_{$i}@example.com",
                    'phone' => "123456{$i}",
                    'created_at' => $date,
                ]);

                $order = Order::create([
                    'customer_id' => $customer->id,
                    'status' => 'completed',
                    'total' => 0,
                    'created_at' => $date->copy()->addHours(rand(11, 22)),
                ]);

                // Add 2-5 items to each order
                $orderTotal = 0;
                $itemCount = rand(2, 5);
                for ($j = 0; $j < $itemCount; $j++) {
                    $menuItem = $menuItems->random();
                    $quantity = rand(1, 3);
                    $orderTotal += $menuItem->price * $quantity;
                }

                $order->update(['total' => $orderTotal]);
            }

            // Create expenses
            if (rand(0, 1)) {
                Expense::create([
                    'expense_date' => $date,
                    'amount' => rand(5000, 15000) / 100,
                    'status' => 'approved',
                    'description' => "Daily expense {$date->format('Y-m-d')}",
                ]);
            }

            // Create reservations
            if ($date->greaterThanOrEqualTo(Carbon::today())) {
                $reservationCount = rand(1, 4);
                for ($i = 0; $i < $reservationCount; $i++) {
                    Reservation::create([
                        'customer_id' => Customer::inRandomOrder()->first()->id,
                        'reservation_date' => $date,
                        'party_size' => rand(2, 8),
                        'status' => rand(0, 1) ? 'confirmed' : 'pending',
                    ]);
                }
            }
        }

        // Create customer requests
        $statuses = ['open', 'in_progress', 'resolved'];
        for ($i = 1; $i <= 15; $i++) {
            CustomerRequest::create([
                'customer_id' => Customer::inRandomOrder()->first()->id,
                'subject' => "Request #{$i}",
                'description' => "Description for request #{$i}",
                'status' => $statuses[array_rand($statuses)],
                'priority' => rand(1, 3),
            ]);
        }
    }
}

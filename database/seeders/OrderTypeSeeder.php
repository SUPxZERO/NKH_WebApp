<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class OrderTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = [
            [
                'code' => 'delivery',
                'name' => 'Delivery',
                'icon' => 'truck',
                'color' => '#3B82F6',
                'allows_delivery' => true,
                'allows_table' => false,
                'allows_pickup' => false,
                'display_order' => 1,
                'description' => 'Order delivered to customer address',
            ],
            [
                'code' => 'dine_in',
                'name' => 'Dine-In',
                'icon' => 'utensils',
                'color' => '#10B981',
                'allows_delivery' => false,
                'allows_table' => true,
                'allows_pickup' => false,
                'display_order' => 2,
                'description' => 'Customer dines at restaurant',
            ],
            [
                'code' => 'pickup',
                'name' => 'Pickup',
                'icon' => 'shopping-bag',
                'color' => '#F59E0B',
                'allows_delivery' => false,
                'allows_table' => false,
                'allows_pickup' => true,
                'display_order' => 3,
                'description' => 'Customer picks up order',
            ],
            [
                'code' => 'takeaway',
                'name' => 'Takeaway',
                'icon' => 'box',
                'color' => '#8B5CF6',
                'allows_delivery' => false,
                'allows_table' => false,
                'allows_pickup' => true,
                'display_order' => 4,
                'description' => 'Same as pickup',
            ],
        ];

        foreach ($types as $type) {
            \App\Models\OrderType::create($type);
        }
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\OrderType;

class OrderTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = [
            [
                'code' => 'dine-in',
                'name' => 'Dine In',
                'description' => 'Eat at the restaurant',
                'is_active' => true,
            ],
            [
                'code' => 'pickup',
                'name' => 'Pickup',
                'description' => 'Customer picks up the order',
                'is_active' => true,
            ],
            [
                'code' => 'delivery',
                'name' => 'Delivery',
                'description' => 'Order delivered to customer address',
                'is_active' => true,
            ],
            [
                'code' => 'dine_in', // Duplicate for legacy/compatibility if needed
                'name' => 'Dine In (Legacy)',
                'description' => 'Legacy dine-in code',
                'is_active' => true,
            ],
        ];

        foreach ($types as $type) {
            OrderType::updateOrCreate(
                ['code' => $type['code']],
                $type
            );
        }
    }
}

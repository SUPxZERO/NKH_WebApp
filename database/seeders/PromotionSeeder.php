<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Promotion;

class PromotionSeeder extends Seeder
{
    public function run(): void
    {
        $promotions = [
            [
                'location_id' => 1,
                'code' => 'NY2025',
                'name' => 'New Year 10% Off',
                'description' => 'Celebrate New Year with 10% off all orders.',
                'type' => 'percentage',
                'value' => 10,
                'min_order_amount' => 0,
                'usage_limit' => 1000,
                'per_customer_limit' => 2,
                'start_at' => '2025-01-01 00:00:00',
                'end_at' => '2025-01-15 23:59:59',
                'is_active' => 1,
            ],
            [
                'location_id' => 1,
                'code' => 'LUNCH5',
                'name' => 'Lunch Fixed $5 Off',
                'description' => 'Get $5 off during lunch hours.',
                'type' => 'fixed',
                'value' => 5,
                'min_order_amount' => 20,
                'usage_limit' => null,
                'per_customer_limit' => null,
                'start_at' => '2025-02-01 11:00:00',
                'end_at' => '2025-02-28 14:00:00',
                'is_active' => 1,
            ],
            [
                'location_id' => 1,
                'code' => 'HAPPYHOUR',
                'name' => 'Happy Hour Special',
                'description' => 'Evening happy hour promotion.',
                'type' => 'happy_hour',
                'value' => 0,
                'min_order_amount' => null,
                'usage_limit' => null,
                'per_customer_limit' => null,
                'start_at' => '2025-03-01 17:00:00',
                'end_at' => '2025-03-31 19:00:00',
                'is_active' => 0,
            ],
        ];

        foreach ($promotions as $promo) {
            // Avoid unique code collision on re-seed
            Promotion::updateOrCreate(
                ['location_id' => $promo['location_id'], 'code' => $promo['code']],
                $promo
            );
        }
    }
}

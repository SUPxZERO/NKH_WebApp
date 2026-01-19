<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Promotion;
use Carbon\Carbon;

class PromotionSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        
        $promotions = [
            [
                'location_id' => 1,
                'code' => 'WELCOME10',
                'name' => 'Welcome 10% Off',
                'description' => 'New customer welcome discount - 10% off your first order!',
                'type' => 'percentage',
                'value' => 10,
                'min_order_amount' => 0,
                'usage_limit' => 1000,
                'per_customer_limit' => 1,
                'start_at' => $now->copy()->subDays(7)->format('Y-m-d H:i:s'),
                'end_at' => $now->copy()->addMonths(3)->format('Y-m-d H:i:s'),
                'is_active' => 1,
            ],
            [
                'location_id' => 1,
                'code' => 'LUNCH5',
                'name' => 'Lunch Special $5 Off',
                'description' => 'Get $5 off during lunch hours (11am - 2pm).',
                'type' => 'fixed',
                'value' => 5,
                'min_order_amount' => 20,
                'usage_limit' => null,
                'per_customer_limit' => null,
                'start_at' => $now->copy()->startOfMonth()->format('Y-m-d 11:00:00'),
                'end_at' => $now->copy()->addMonths(2)->format('Y-m-d 14:00:00'),
                'is_active' => 1,
            ],
            [
                'location_id' => 1,
                'code' => 'HAPPYHOUR',
                'name' => 'Happy Hour 15% Off',
                'description' => 'Enjoy 15% off during happy hour (5pm - 7pm daily).',
                'type' => 'percentage',
                'value' => 15,
                'min_order_amount' => null,
                'usage_limit' => null,
                'per_customer_limit' => null,
                'start_at' => $now->copy()->subDays(30)->format('Y-m-d 17:00:00'),
                'end_at' => $now->copy()->addMonths(6)->format('Y-m-d 19:00:00'),
                'is_active' => 1,
            ],
            [
                'location_id' => 1,
                'code' => 'WEEKEND20',
                'name' => 'Weekend Special 20% Off',
                'description' => 'Exclusive weekend discount - 20% off orders over $50!',
                'type' => 'percentage',
                'value' => 20,
                'min_order_amount' => 50,
                'usage_limit' => 500,
                'per_customer_limit' => 2,
                'start_at' => $now->copy()->startOfWeek()->format('Y-m-d 00:00:00'),
                'end_at' => $now->copy()->addWeeks(8)->format('Y-m-d 23:59:59'),
                'is_active' => 1,
            ],
            [
                'location_id' => 1,
                'code' => 'EXPIRED2024',
                'name' => 'Holiday Special (Expired)',
                'description' => 'This promotion has ended.',
                'type' => 'percentage',
                'value' => 25,
                'min_order_amount' => 30,
                'usage_limit' => 100,
                'per_customer_limit' => 1,
                'start_at' => $now->copy()->subMonths(3)->format('Y-m-d 00:00:00'),
                'end_at' => $now->copy()->subDays(30)->format('Y-m-d 23:59:59'),
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

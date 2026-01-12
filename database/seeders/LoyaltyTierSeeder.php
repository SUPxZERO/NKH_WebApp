<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class LoyaltyTierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tiers = [
            [
                'code' => 'bronze',
                'name' => 'Bronze',
                'icon' => 'medal',
                'color' => '#CD7F32',
                'min_spent' => 0,
                'max_spent' => 500,
                'discount_percent' => 0,
                'points_multiplier' => 1,
                'benefits' => json_encode(['Basic member benefits', 'Birthday rewards']),
                'display_order' => 1,
                'description' => 'Entry level loyalty tier',
            ],
            [
                'code' => 'silver',
                'name' => 'Silver',
                'icon' => 'medal',
                'color' => '#C0C0C0',
                'min_spent' => 500,
                'max_spent' => 2000,
                'discount_percent' => 5,
                'points_multiplier' => 1.5,
                'benefits' => json_encode(['5% discount', '1.5x points', 'Priority support']),
                'display_order' => 2,
                'description' => 'Mid-tier loyalty benefits',
            ],
            [
                'code' => 'gold',
                'name' => 'Gold',
                'icon' => 'medal',
                'color' => '#FFD700',
                'min_spent' => 2000,
                'max_spent' => 5000,
                'discount_percent' => 10,
                'points_multiplier' => 2,
                'benefits' => json_encode(['10% discount', '2x points', 'Free delivery', 'VIP events']),
                'display_order' => 3,
                'description' => 'Premium loyalty tier',
            ],
            [
                'code' => 'platinum',
                'name' => 'Platinum',
                'icon' => 'crown',
                'color' => '#E5E4E2',
                'min_spent' => 5000,
                'max_spent' => null, // Unlimited
                'discount_percent' => 15,
                'points_multiplier' => 3,
                'benefits' => json_encode(['15% discount', '3x points', 'Concierge service', 'Exclusive menu access']),
                'display_order' => 4,
                'description' => 'Highest loyalty tier with maximum benefits',
            ],
        ];

        foreach ($tiers as $tier) {
            \App\Models\LoyaltyTier::create($tier);
        }
    }
}

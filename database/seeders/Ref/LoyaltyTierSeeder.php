<?php

namespace Database\Seeders\Ref;

use Illuminate\Database\Seeder;
use App\Models\LoyaltyTier;

class LoyaltyTierSeeder extends Seeder
{
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
                'benefits' => ['Basic member benefits', 'Birthday rewards'],
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
                'benefits' => ['5% discount', '1.5x points', 'Priority support'],
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
                'benefits' => ['10% discount', '2x points', 'Free delivery', 'VIP events'],
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
                'benefits' => ['15% discount', '3x points', 'Concierge service', 'Exclusive menu access'],
                'display_order' => 4,
                'description' => 'Highest loyalty tier with maximum benefits',
            ],
        ];

        foreach ($tiers as $tier) {
            // Encode benefits array to JSON if strictly required, but Laravel casts usually handle it if set.
            // Checking model casts... Assuming casts are set or we need to encode.
            // The original seeder used json_encode. We should probably use it unless we are sure.
            // Let's use json_encode to be safe as per original seeder.
            $data = $tier;
            $data['benefits'] = json_encode($tier['benefits']);

            LoyaltyTier::updateOrCreate(
                ['code' => $tier['code']],
                $data
            );
        }
    }
}

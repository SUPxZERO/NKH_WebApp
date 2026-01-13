<?php

namespace Database\Factories;

use App\Models\LoyaltyTier;
use Illuminate\Database\Eloquent\Factories\Factory;

class LoyaltyTierFactory extends Factory
{
    protected $model = LoyaltyTier::class;

    public function definition(): array
    {
        return [
            'name' => 'Bronze',
            'code' => 'bronze',
            'min_points' => 0,
            'multiplier' => 1.0,
            'color' => '#CD7F32',
        ];
    }
}

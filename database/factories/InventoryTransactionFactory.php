<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\InventoryTransaction;
use App\Models\Ingredient;
use App\Models\Location;
use App\Models\User;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\InventoryTransaction>
 */
class InventoryTransactionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'ingredient_id' => Ingredient::factory(),
            'location_id' => Location::factory(), // This is the issue - ensuring a location exists
            'user_id' => User::factory(),
            'created_by' => User::factory(),
            'type' => $this->faker->randomElement(['purchase', 'usage', 'adjustment', 'waste']),
            'quantity' => $this->faker->randomFloat(2, 1, 100),
            'unit_cost' => $this->faker->randomFloat(2, 1, 50),
            'value' => $this->faker->randomFloat(2, 10, 500),
            'transacted_at' => now(),
            'movement_type' => $this->faker->randomElement(['in', 'out']),
            'unit' => 'kg',
        ];
    }
}

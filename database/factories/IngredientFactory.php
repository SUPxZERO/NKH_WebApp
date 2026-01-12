<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ingredient>
 */
class IngredientFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'location_id' => \App\Models\Location::factory(),
            'name' => $this->faker->word,
            'code' => $this->faker->unique()->bothify('ING-####'),
            'cost_per_unit' => $this->faker->randomFloat(2, 1, 100),
            'current_stock' => $this->faker->randomFloat(2, 0, 100),
            'min_stock_level' => 10,
            'max_stock_level' => 100,
            'is_active' => true,
        ];
    }
}

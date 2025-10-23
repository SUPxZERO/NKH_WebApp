<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Location;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
{
    protected $model = Customer::class;

    public function definition(): array
    {
        $location = Location::inRandomOrder()->first();
        return [
            'user_id' => User::factory(),
            'preferred_location_id' => $location?->id,
            'customer_code' => $this->faker->unique()->regexify('[A-Z]{2}[0-9]{4}'),
            'birth_date' => $this->faker->optional()->date(),
            'gender' => $this->faker->randomElement(['male','female','other']),
            'loyalty_points' => $this->faker->numberBetween(0, 1000),
            'total_spent' => $this->faker->randomFloat(2, 0, 5000),
            'preferred_language' => $this->faker->randomElement(['en', 'es', 'fr']),
            'dietary_preferences' => $this->faker->randomElements(['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free'], $this->faker->numberBetween(0, 3)),
            'marketing_consent' => $this->faker->boolean(),
            'preferences' => [],
            'points_balance' => 0,
            'notes' => $this->faker->optional()->sentence(),
        ];
    }
}

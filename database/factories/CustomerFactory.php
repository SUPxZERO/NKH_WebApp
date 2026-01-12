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
            // customer_code auto-generated in model boot()
            'birth_date' => $this->faker->optional()->date(),
            'gender' => $this->faker->randomElement(['male','female','other']),
            // loyalty_points, total_spent, points_balance are guarded (system-managed)
            'preferred_language' => $this->faker->randomElement(['en', 'km']),
            'dietary_preferences' => $this->faker->randomElements(['vegetarian', 'vegan', 'gluten-free'], $this->faker->numberBetween(0, 2)),
            'marketing_consent' => $this->faker->boolean(),
            'preferences' => [],
            'notes' => $this->faker->optional()->sentence(),
        ];
    }
}

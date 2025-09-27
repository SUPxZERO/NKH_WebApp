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
            'birth_date' => $this->faker->optional()->date(),
            'gender' => $this->faker->randomElement(['male','female','other']),
            'preferences' => [],
            'points_balance' => 0,
            'notes' => $this->faker->optional()->sentence(),
        ];
    }
}

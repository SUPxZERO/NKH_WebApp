<?php

namespace Database\Factories;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\CustomerAddress>
 */
class CustomerAddressFactory extends Factory
{
    public function definition(): array
    {
        return [
            'customer_id' => Customer::factory(),
            'label' => $this->faker->randomElement(['Home','Work','Other']),
            'address_line_1' => $this->faker->streetAddress(),
            'address_line_2' => $this->faker->optional()->secondaryAddress(),
            'city' => $this->faker->city(),
            'province' => $this->faker->state(),
            'postal_code' => $this->faker->postcode(),
            'latitude' => $this->faker->optional()->latitude(),
            'longitude' => $this->faker->optional()->longitude(),
            'delivery_instructions' => $this->faker->optional()->sentence(),
        ];
    }
}

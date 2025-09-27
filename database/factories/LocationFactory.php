<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Location>
 */
class LocationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'code' => 'LOC-'.strtoupper(Str::random(5)),
            'name' => $this->faker->company().' Branch',
            'address_line1' => $this->faker->streetAddress(),
            'city' => $this->faker->city(),
            'state' => $this->faker->state(),
            'postal_code' => $this->faker->postcode(),
            'country' => $this->faker->country(),
            'phone' => $this->faker->phoneNumber(),
            'is_active' => true,
            'accepts_online_orders' => $this->faker->boolean(70),
            'accepts_pickup' => $this->faker->boolean(70),
            'accepts_delivery' => $this->faker->boolean(60),
        ];
    }
}

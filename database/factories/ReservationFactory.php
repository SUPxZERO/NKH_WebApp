<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\DiningTable;
use App\Models\Location;
use App\Models\Reservation;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ReservationFactory extends Factory
{
    protected $model = Reservation::class;

    public function definition(): array
    {
        $date = $this->faker->dateTimeBetween('-1 month', '+1 month');
        $time = $this->faker->randomElement([
            '11:30:00', '12:00:00', '12:30:00', '13:00:00',
            '18:00:00', '18:30:00', '19:00:00', '19:30:00'
        ]);

        return [
            'location_id' => Location::factory(),
            'customer_id' => Customer::factory(),
            'table_id' => DiningTable::factory(),
            'code' => Str::random(10),
            'reservation_number' => 'RES-' . strtoupper(Str::random(8)),
            'reserved_for' => $this->faker->name,
            'party_size' => $this->faker->numberBetween(2, 8),
            'reservation_date' => $date->format('Y-m-d'),
            'reservation_time' => $time,
            'status' => 'confirmed',
            'special_requests' => $this->faker->optional(0.3)->sentence,
            'notes' => $this->faker->optional(0.2)->sentence,
        ];
    }

    public function past(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'reservation_date' => $this->faker->dateTimeBetween('-2 months', '-1 day')->format('Y-m-d'),
                'status' => $this->faker->randomElement(['completed', 'cancelled', 'no_show']),
            ];
        });
    }

    public function future(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'reservation_date' => $this->faker->dateTimeBetween('+1 day', '+2 months')->format('Y-m-d'),
                'status' => $this->faker->randomElement(['confirmed', 'pending']),
            ];
        });
    }
}

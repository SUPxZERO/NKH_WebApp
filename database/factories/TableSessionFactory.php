<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\DiningTable;
use App\Models\TableSession;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class TableSessionFactory extends Factory
{
    protected $model = TableSession::class;

    public function definition(): array
    {
        return [
            'table_id' => DiningTable::factory(),
            'customer_id' => null, // Guest by default
            'telegram_user_id' => null,
            'session_token' => Str::random(32),
            'status' => 'active',
            'device_fingerprint' => $this->faker->md5,
            'user_agent' => $this->faker->userAgent,
            'ip_address' => $this->faker->ipv4,
            'started_at' => now(),
            'last_activity_at' => now(),
        ];
    }

    public function withCustomer(): static
    {
        return $this->state(fn (array $attributes) => [
            'customer_id' => Customer::factory(),
        ]);
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
            'closed_at' => null,
        ]);
    }

    public function closed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'closed_at' => now(),
        ]);
    }
}

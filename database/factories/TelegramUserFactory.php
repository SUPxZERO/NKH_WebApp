<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\TelegramUser;
use Illuminate\Database\Eloquent\Factories\Factory;

class TelegramUserFactory extends Factory
{
    protected $model = TelegramUser::class;

    public function definition(): array
    {
        return [
            'telegram_id' => $this->faker->unique()->numberBetween(100000000, 999999999),
            'telegram_username' => $this->faker->userName,
            'first_name' => $this->faker->firstName,
            'last_name' => $this->faker->lastName,
            'language_code' => 'en',
            'is_active' => true,
            'notifications_enabled' => true,
        ];
    }

    public function linked(): static
    {
        return $this->state(fn (array $attributes) => [
            'customer_id' => Customer::factory(),
        ]);
    }
}

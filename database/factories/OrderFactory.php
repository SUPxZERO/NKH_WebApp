<?php

namespace Database\Factories;

use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        return [
            'order_type_id' => \App\Models\OrderType::inRandomOrder()->first()?->id ?? \App\Models\OrderType::factory(),
            'order_status_id' => \App\Models\OrderStatus::inRandomOrder()->first()?->id ?? \App\Models\OrderStatus::factory(),
            'order_number' => 'TEST-' . $this->faker->unique()->numerify('######'),
            // 'order_type' => 'dine-in', // DEPRECATED: Handled by order_type_id
            // 'status' => 'pending',   // DEPRECATED: Handled by order_status_id
            'payment_status' => 'unpaid',
            'subtotal' => $this->faker->randomFloat(2, 10, 200),
            'tax_amount' => 0,
            'discount_amount' => 0,
            'total_amount' => $this->faker->randomFloat(2, 10, 200),
            'currency' => 'USD',
            'ordered_at' => now(),
        ];
    }
}

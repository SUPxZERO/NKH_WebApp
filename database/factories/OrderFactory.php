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
            'order_number' => 'TEST-' . $this->faker->unique()->numerify('######'),
            'order_type' => $this->faker->randomElement(['dine-in', 'pickup', 'delivery']),
            'status' => 'received',
            'payment_status' => 'unpaid',
            'subtotal' => $this->faker->randomFloat(2, 10, 200),
            'tax_amount' => 0,
            'discount_amount' => 0,
            'total_amount' => $this->faker->randomFloat(2, 10, 200),
            'currency' => 'USD',
            'ordered_at' => now(),
            'approval_status' => 'approved',
        ];
    }
}

<?php

namespace Database\Factories;

use App\Models\OrderStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderStatusFactory extends Factory
{
    protected $model = OrderStatus::class;

    public function definition(): array
    {
        return [
            'name' => 'Pending',
            'code' => 'pending',
            'description' => 'Order received but not yet processed',
            'color' => '#FFA500',
            'icon' => 'clock',
            'workflow_position' => 1,
        ];
    }
}

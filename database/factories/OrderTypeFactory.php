<?php

namespace Database\Factories;

use App\Models\OrderType;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderTypeFactory extends Factory
{
    protected $model = OrderType::class;

    public function definition(): array
    {
        return [
            'name' => 'Dine In',
            'code' => 'dine_in',
            'description' => 'Standard dine-in service',
            'is_active' => true,
        ];
    }
}

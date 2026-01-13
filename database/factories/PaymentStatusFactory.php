<?php

namespace Database\Factories;

use App\Models\PaymentStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaymentStatusFactory extends Factory
{
    protected $model = PaymentStatus::class;

    public function definition(): array
    {
        return [
            'name' => 'Pending',
            'code' => 'pending',
            'description' => 'Payment awaiting processing',
            'is_terminal' => false,
        ];
    }
}

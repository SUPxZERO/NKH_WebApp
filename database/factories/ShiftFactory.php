<?php

namespace Database\Factories;

use App\Models\Shift;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ShiftFactory extends Factory
{
    protected $model = Shift::class;

    public function definition(): array
    {
        $start = $this->faker->dateTimeBetween('now', '+7 days');
        $end = (clone $start)->modify('+8 hours');
        
        return [
            'user_id' => User::factory(),
            'date' => $start->format('Y-m-d'),
            'start_time' => $start->format('H:i:s'),
            'end_time' => $end->format('H:i:s'),
            'status' => 'scheduled',
        ];
    }
}

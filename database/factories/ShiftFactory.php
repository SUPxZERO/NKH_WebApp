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
            'employee_id' => \App\Models\Employee::factory(),
            'location_id' => \App\Models\Location::factory(),
            'date' => $start->format('Y-m-d'),
            'start_time' => $start->format('H:i:s'),
            'end_time' => $end->format('H:i:s'),
            'shift_type' => $this->faker->randomElement(['morning', 'afternoon', 'evening', 'night']),
            'status' => 'scheduled',
        ];
    }
}

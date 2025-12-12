<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmployeeFactory extends Factory
{
    protected $model = Employee::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'employee_code' => 'EMP-' . $this->faker->unique()->numerify('####'),
            'hire_date' => $this->faker->date(),
            'employment_status' => 'active',
            'hourly_rate' => $this->faker->randomFloat(2, 10, 30),
        ];
    }
}

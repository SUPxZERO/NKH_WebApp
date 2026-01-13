<?php

namespace Database\Factories;

use App\Models\DiningTable;
use App\Models\Floor;
use Illuminate\Database\Eloquent\Factories\Factory;

class DiningTableFactory extends Factory
{
    protected $model = DiningTable::class;

    public function definition(): array
    {
        return [
            'floor_id' => Floor::factory(),
            'table_number' => $this->faker->unique()->numberBetween(1, 100),
            'capacity' => $this->faker->randomElement([2, 4, 6, 8]),
            'status' => 'available',
            'qr_code' => $this->faker->uuid,
        ];
    }
}

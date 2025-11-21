<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ExpenseCategory;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'location_id' => 1,
                'name' => 'Food Supplies',
                'description' => 'Ingredients, raw materials, and food products.',
                'is_active' => 1,
            ],
            [
                'location_id' => 1,
                'name' => 'Utilities',
                'description' => 'Electricity, water, and internet services.',
                'is_active' => 1,
            ],
            [
                'location_id' => 1,
                'name' => 'Maintenance',
                'description' => 'Equipment repairs and services.',
                'is_active' => 1,
            ],
            [
                'location_id' => 1,
                'name' => 'Staff Salaries',
                'description' => 'Monthly employee salary expenses.',
                'is_active' => 1,
            ]
        ];

        foreach ($categories as $cat) {
            ExpenseCategory::create($cat);
        }
    }
}

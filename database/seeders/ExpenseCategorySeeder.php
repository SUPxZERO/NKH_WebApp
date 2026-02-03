<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ExpenseCategory;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $locationId = \App\Models\Location::first()?->id ?? 1;

        $categories = [
            [
                'location_id' => $locationId,
                'name' => 'Food Supplies',
                'description' => 'Ingredients, raw materials, and food products.',
                'is_active' => 1,
            ],
            [
                'location_id' => $locationId,
                'name' => 'Utilities',
                'description' => 'Electricity, water, and internet services.',
                'is_active' => 1,
            ],
            [
                'location_id' => $locationId,
                'name' => 'Maintenance',
                'description' => 'Equipment repairs and services.',
                'is_active' => 1,
            ],
            [
                'location_id' => $locationId,
                'name' => 'Staff Salaries',
                'description' => 'Monthly employee salary expenses.',
                'is_active' => 1,
            ]
        ];

        foreach ($categories as $cat) {
            ExpenseCategory::firstOrCreate(['name' => $cat['name'], 'location_id' => $cat['location_id']], $cat);
        }
    }
}

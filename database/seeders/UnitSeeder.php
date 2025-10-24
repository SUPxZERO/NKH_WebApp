<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Unit;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        $units = [
            [
                'code' => 'kg',
                'name' => 'Kilogram',
                'display_name' => 'kg',
                'base_unit' => null,
                'conversion_factor' => null,
                'is_base_unit' => true,
                'for_weight' => true
            ],
            [
                'code' => 'g',
                'name' => 'Gram',
                'display_name' => 'g',
                'base_unit' => 'kg',
                'conversion_factor' => 0.001,
                'is_base_unit' => false,
                'for_weight' => true
            ],
            [
                'code' => 'l',
                'name' => 'Liter',
                'display_name' => 'L',
                'base_unit' => null,
                'conversion_factor' => null,
                'is_base_unit' => true,
                'for_volume' => true
            ],
            [
                'code' => 'ml',
                'name' => 'Milliliter',
                'display_name' => 'mL',
                'base_unit' => 'l',
                'conversion_factor' => 0.001,
                'is_base_unit' => false,
                'for_volume' => true
            ],
            [
                'code' => 'pcs',
                'name' => 'Piece',
                'display_name' => 'pc',
                'base_unit' => null,
                'conversion_factor' => null,
                'is_base_unit' => true,
                'for_quantity' => true
            ],
            [
                'code' => 'dz',
                'name' => 'Dozen',
                'display_name' => 'dz',
                'base_unit' => 'pcs',
                'conversion_factor' => 12,
                'is_base_unit' => false,
                'for_quantity' => true
            ],
            [
                'code' => 'box',
                'name' => 'Box',
                'display_name' => 'box',
                'base_unit' => null,
                'conversion_factor' => null,
                'is_base_unit' => true,
                'for_packaging' => true
            ],
            [
                'code' => 'case',
                'name' => 'Case',
                'display_name' => 'case',
                'base_unit' => null,
                'conversion_factor' => null,
                'is_base_unit' => true,
                'for_packaging' => true
            ],
            [
                'code' => 'pack',
                'name' => 'Pack',
                'display_name' => 'pack',
                'base_unit' => null,
                'conversion_factor' => null,
                'is_base_unit' => true,
                'for_packaging' => true
            ],
            [
                'code' => 'bag',
                'name' => 'Bag',
                'display_name' => 'bag',
                'base_unit' => null,
                'conversion_factor' => null,
                'is_base_unit' => true,
                'for_packaging' => true
            ],
            [
                'code' => 'bunch',
                'name' => 'Bunch',
                'display_name' => 'bunch',
                'base_unit' => null,
                'conversion_factor' => null,
                'is_base_unit' => true,
                'for_produce' => true
            ],
            [
                'code' => 'tsp',
                'name' => 'Teaspoon',
                'display_name' => 'tsp',
                'base_unit' => 'ml',
                'conversion_factor' => 5,
                'is_base_unit' => false,
                'for_volume' => true
            ],
            [
                'code' => 'tbsp',
                'name' => 'Tablespoon',
                'display_name' => 'tbsp',
                'base_unit' => 'ml',
                'conversion_factor' => 15,
                'is_base_unit' => false,
                'for_volume' => true
            ],
            [
                'code' => 'cup',
                'name' => 'Cup',
                'display_name' => 'cup',
                'base_unit' => 'ml',
                'conversion_factor' => 250,
                'is_base_unit' => false,
                'for_volume' => true
            ]
        ];

        foreach ($units as $unit) {
            Unit::create($unit);
        }
    }
}
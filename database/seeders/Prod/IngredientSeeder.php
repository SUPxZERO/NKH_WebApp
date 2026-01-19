<?php

namespace Database\Seeders\Prod;

use Illuminate\Database\Seeder;
use App\Models\Ingredient;
use App\Models\Unit;
use App\Models\Supplier;

class IngredientSeeder extends Seeder
{
    public function run(): void
    {
        // Get deps
        $kgUnit = Unit::where('code', 'kg')->first();
        $lUnit = Unit::where('code', 'l')->first();
        $gUnit = Unit::where('code', 'g')->first();
        $pcsUnit = Unit::where('code', 'pcs')->first();
        $unitUnit = $pcsUnit ?? $kgUnit; // Fallback

        // Get Suppliers - fallback to first if specific ones missing
        $suppliers = Supplier::where('is_active', true)->get();
        $sup1 = $suppliers->where('code', 'SUP-001')->first() ?? $suppliers->first();
        $sup2 = $suppliers->where('code', 'SUP-002')->first() ?? $suppliers->first();
        $sup3 = $suppliers->where('code', 'SUP-003')->first() ?? $suppliers->first();
        $sup4 = $suppliers->where('code', 'SUP-004')->first() ?? $suppliers->first();
        $sup5 = $suppliers->where('code', 'SUP-005')->first() ?? $suppliers->first();
        $sup9 = $suppliers->where('code', 'SUP-009')->first() ?? $suppliers->first();
        $sup10 = $suppliers->where('code', 'SUP-010')->first() ?? $suppliers->first();
        $sup11 = $suppliers->where('code', 'SUP-011')->first() ?? $suppliers->first();
        $sup12 = $suppliers->where('code', 'SUP-012')->first() ?? $suppliers->first();

        $ingredients = [
            // Vegetables (SUP-001) - Mix of good stock and low stock
            ['code' => 'VEG-001', 'name' => 'Tomatoes', 'category' => 'vegetables', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup1->id, 'cost_per_unit' => 3.50, 'current_stock' => 35, 'min_stock_level' => 5, 'max_stock_level' => 50, 'reorder_point' => 10],
            ['code' => 'VEG-002', 'name' => 'Lettuce', 'category' => 'vegetables', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup1->id, 'cost_per_unit' => 2.80, 'current_stock' => 22, 'min_stock_level' => 5, 'max_stock_level' => 30, 'reorder_point' => 8],
            ['code' => 'VEG-003', 'name' => 'Onions', 'category' => 'vegetables', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup1->id, 'cost_per_unit' => 1.50, 'current_stock' => 45, 'min_stock_level' => 10, 'max_stock_level' => 60, 'reorder_point' => 15],
            ['code' => 'VEG-004', 'name' => 'Garlic', 'category' => 'vegetables', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup1->id, 'cost_per_unit' => 4.00, 'current_stock' => 3, 'min_stock_level' => 2, 'max_stock_level' => 20, 'reorder_point' => 5], // LOW STOCK
            ['code' => 'VEG-005', 'name' => 'Carrots', 'category' => 'vegetables', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup1->id, 'cost_per_unit' => 1.20, 'current_stock' => 38, 'min_stock_level' => 10, 'max_stock_level' => 50, 'reorder_point' => 15],
            ['code' => 'VEG-006', 'name' => 'Morning Glory', 'category' => 'vegetables', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup1->id, 'cost_per_unit' => 2.00, 'current_stock' => 12, 'min_stock_level' => 5, 'max_stock_level' => 20, 'reorder_point' => 8],
            ['code' => 'VEG-007', 'name' => 'Bok Choy', 'category' => 'vegetables', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup1->id, 'cost_per_unit' => 2.50, 'current_stock' => 15, 'min_stock_level' => 5, 'max_stock_level' => 20, 'reorder_point' => 8],
            ['code' => 'VEG-008', 'name' => 'Lemongrass', 'category' => 'vegetables', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup1->id, 'cost_per_unit' => 1.50, 'current_stock' => 6, 'min_stock_level' => 2, 'max_stock_level' => 10, 'reorder_point' => 4],
            ['code' => 'VEG-009', 'name' => 'Galangal', 'category' => 'vegetables', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup1->id, 'cost_per_unit' => 3.00, 'current_stock' => 1.5, 'min_stock_level' => 1, 'max_stock_level' => 5, 'reorder_point' => 2], // LOW STOCK
            ['code' => 'VEG-010', 'name' => 'Basil', 'category' => 'vegetables', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup1->id, 'cost_per_unit' => 4.00, 'current_stock' => 3.5, 'min_stock_level' => 1, 'max_stock_level' => 5, 'reorder_point' => 2],
            ['code' => 'VEG-011', 'name' => 'Kaffir Lime Leaves', 'category' => 'vegetables', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup1->id, 'cost_per_unit' => 8.00, 'current_stock' => 0.8, 'min_stock_level' => 0.5, 'max_stock_level' => 2, 'reorder_point' => 1], // LOW STOCK
            ['code' => 'VEG-012', 'name' => 'Bell Peppers', 'category' => 'vegetables', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup1->id, 'cost_per_unit' => 5.50, 'current_stock' => 25, 'min_stock_level' => 5, 'max_stock_level' => 40, 'reorder_point' => 10],
            ['code' => 'VEG-013', 'name' => 'Mushrooms', 'category' => 'vegetables', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup1->id, 'cost_per_unit' => 12.00, 'current_stock' => 8, 'min_stock_level' => 3, 'max_stock_level' => 15, 'reorder_point' => 5],

            // Seafood (SUP-002) - Mix of fresh and frozen
            ['code' => 'SEA-001', 'name' => 'Fresh Salmon', 'category' => 'seafood', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup2->id, 'cost_per_unit' => 22.00, 'current_stock' => 12, 'min_stock_level' => 3, 'max_stock_level' => 20, 'reorder_point' => 6],
            ['code' => 'SEA-002', 'name' => 'Tiger Prawns', 'category' => 'seafood', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup2->id, 'cost_per_unit' => 18.00, 'current_stock' => 18, 'min_stock_level' => 5, 'max_stock_level' => 30, 'reorder_point' => 10],
            ['code' => 'SEA-003', 'name' => 'Squid', 'category' => 'seafood', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup2->id, 'cost_per_unit' => 12.00, 'current_stock' => 15, 'min_stock_level' => 5, 'max_stock_level' => 25, 'reorder_point' => 8],
            ['code' => 'SEA-004', 'name' => 'Mussels', 'category' => 'seafood', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup2->id, 'cost_per_unit' => 8.50, 'current_stock' => 4, 'min_stock_level' => 5, 'max_stock_level' => 20, 'reorder_point' => 8], // LOW STOCK
            ['code' => 'SEA-005', 'name' => 'Tuna Steaks', 'category' => 'seafood', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup2->id, 'cost_per_unit' => 25.00, 'current_stock' => 10, 'min_stock_level' => 3, 'max_stock_level' => 15, 'reorder_point' => 5],

            // Spices (SUP-003)
            ['code' => 'SPI-001', 'name' => 'Kampot Black Pepper', 'category' => 'spices', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup3->id, 'cost_per_unit' => 40.00, 'current_stock' => 6, 'min_stock_level' => 1, 'max_stock_level' => 10, 'reorder_point' => 2],
            ['code' => 'SPI-002', 'name' => 'Sea Salt', 'category' => 'spices', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup3->id, 'cost_per_unit' => 2.00, 'current_stock' => 35, 'min_stock_level' => 5, 'max_stock_level' => 50, 'reorder_point' => 10],
            ['code' => 'SPI-003', 'name' => 'Chili Powder', 'category' => 'spices', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup3->id, 'cost_per_unit' => 15.00, 'current_stock' => 4.5, 'min_stock_level' => 2, 'max_stock_level' => 10, 'reorder_point' => 3],
            ['code' => 'SPI-004', 'name' => 'Turmeric Powder', 'category' => 'spices', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup3->id, 'cost_per_unit' => 12.00, 'current_stock' => 3.2, 'min_stock_level' => 2, 'max_stock_level' => 8, 'reorder_point' => 3],

            // Dry Goods (SUP-004)
            ['code' => 'DRY-001', 'name' => 'Fish Sauce', 'category' => 'condiments', 'unit_id' => $lUnit->id, 'supplier_id' => $sup4->id, 'cost_per_unit' => 3.00, 'current_stock' => 65, 'min_stock_level' => 10, 'max_stock_level' => 100, 'reorder_point' => 20],
            ['code' => 'DRY-002', 'name' => 'Soy Sauce', 'category' => 'condiments', 'unit_id' => $lUnit->id, 'supplier_id' => $sup4->id, 'cost_per_unit' => 2.50, 'current_stock' => 72, 'min_stock_level' => 10, 'max_stock_level' => 100, 'reorder_point' => 20],
            ['code' => 'DRY-003', 'name' => 'Oyster Sauce', 'category' => 'condiments', 'unit_id' => $lUnit->id, 'supplier_id' => $sup4->id, 'cost_per_unit' => 3.50, 'current_stock' => 32, 'min_stock_level' => 5, 'max_stock_level' => 50, 'reorder_point' => 10],
            ['code' => 'DRY-004', 'name' => 'Coconut Milk', 'category' => 'condiments', 'unit_id' => $lUnit->id, 'supplier_id' => $sup4->id, 'cost_per_unit' => 2.50, 'current_stock' => 38, 'min_stock_level' => 10, 'max_stock_level' => 50, 'reorder_point' => 15],
            ['code' => 'DRY-005', 'name' => 'Curry Paste', 'category' => 'condiments', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup4->id, 'cost_per_unit' => 5.00, 'current_stock' => 6, 'min_stock_level' => 2, 'max_stock_level' => 10, 'reorder_point' => 4],
            ['code' => 'DRY-006', 'name' => 'Sugar', 'category' => 'condiments', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup4->id, 'cost_per_unit' => 1.00, 'current_stock' => 75, 'min_stock_level' => 10, 'max_stock_level' => 100, 'reorder_point' => 20],
            ['code' => 'OIL-001', 'name' => 'Vegetable Oil', 'category' => 'oils', 'unit_id' => $lUnit->id, 'supplier_id' => $sup4->id, 'cost_per_unit' => 5.50, 'current_stock' => 145, 'min_stock_level' => 20, 'max_stock_level' => 200, 'reorder_point' => 50],
            ['code' => 'OIL-002', 'name' => 'Sesame Oil', 'category' => 'oils', 'unit_id' => $lUnit->id, 'supplier_id' => $sup4->id, 'cost_per_unit' => 12.00, 'current_stock' => 8, 'min_stock_level' => 3, 'max_stock_level' => 15, 'reorder_point' => 5], // LOW STOCK

            // Rice (SUP-005)
            ['code' => 'RIC-001', 'name' => 'Jasmine Rice', 'category' => 'grains', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup5->id, 'cost_per_unit' => 1.80, 'current_stock' => 380, 'min_stock_level' => 50, 'max_stock_level' => 500, 'reorder_point' => 100],
            ['code' => 'RIC-002', 'name' => 'Rice Noodles', 'category' => 'grains', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup5->id, 'cost_per_unit' => 1.50, 'current_stock' => 68, 'min_stock_level' => 20, 'max_stock_level' => 100, 'reorder_point' => 30],
            ['code' => 'RIC-003', 'name' => 'Egg Noodles', 'category' => 'grains', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup5->id, 'cost_per_unit' => 2.00, 'current_stock' => 32, 'min_stock_level' => 10, 'max_stock_level' => 50, 'reorder_point' => 15],

            // Proteins (SUP-009 - Premium Meats)
            ['code' => 'PRT-001', 'name' => 'Chicken Breast', 'category' => 'meat', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup9->id, 'cost_per_unit' => 5.50, 'current_stock' => 35, 'min_stock_level' => 10, 'max_stock_level' => 50, 'reorder_point' => 15],
            ['code' => 'PRT-002', 'name' => 'Pork Belly', 'category' => 'meat', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup9->id, 'cost_per_unit' => 6.00, 'current_stock' => 28, 'min_stock_level' => 10, 'max_stock_level' => 50, 'reorder_point' => 15],
            ['code' => 'PRT-003', 'name' => 'Beef Sirloin', 'category' => 'meat', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup9->id, 'cost_per_unit' => 12.00, 'current_stock' => 18, 'min_stock_level' => 5, 'max_stock_level' => 30, 'reorder_point' => 10],
            ['code' => 'PRT-004', 'name' => 'Duck', 'category' => 'meat', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup9->id, 'cost_per_unit' => 7.50, 'current_stock' => 12, 'min_stock_level' => 5, 'max_stock_level' => 20, 'reorder_point' => 8],
            ['code' => 'PRT-005', 'name' => 'Eggs', 'category' => 'dairy', 'unit_id' => $unitUnit->id, 'supplier_id' => $sup5->id, 'cost_per_unit' => 0.15, 'current_stock' => 320, 'min_stock_level' => 100, 'max_stock_level' => 500, 'reorder_point' => 150],
            ['code' => 'PRT-006', 'name' => 'Tofu', 'category' => 'dairy', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup5->id, 'cost_per_unit' => 2.00, 'current_stock' => 14, 'min_stock_level' => 5, 'max_stock_level' => 20, 'reorder_point' => 8],
            ['code' => 'PRT-007', 'name' => 'Lamb Chops', 'category' => 'meat', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup9->id, 'cost_per_unit' => 18.00, 'current_stock' => 6, 'min_stock_level' => 3, 'max_stock_level' => 15, 'reorder_point' => 5],

            // Dairy (SUP-010)
            ['code' => 'DAI-001', 'name' => 'Whole Milk', 'category' => 'dairy', 'unit_id' => $lUnit->id, 'supplier_id' => $sup10->id, 'cost_per_unit' => 1.80, 'current_stock' => 45, 'min_stock_level' => 10, 'max_stock_level' => 80, 'reorder_point' => 20],
            ['code' => 'DAI-002', 'name' => 'Heavy Cream', 'category' => 'dairy', 'unit_id' => $lUnit->id, 'supplier_id' => $sup10->id, 'cost_per_unit' => 4.50, 'current_stock' => 12, 'min_stock_level' => 5, 'max_stock_level' => 25, 'reorder_point' => 8],
            ['code' => 'DAI-003', 'name' => 'Butter', 'category' => 'dairy', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup10->id, 'cost_per_unit' => 8.00, 'current_stock' => 15, 'min_stock_level' => 5, 'max_stock_level' => 30, 'reorder_point' => 10],
            ['code' => 'DAI-004', 'name' => 'Mozzarella Cheese', 'category' => 'dairy', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup10->id, 'cost_per_unit' => 12.00, 'current_stock' => 8, 'min_stock_level' => 3, 'max_stock_level' => 20, 'reorder_point' => 6],
            ['code' => 'DAI-005', 'name' => 'Parmesan Cheese', 'category' => 'dairy', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup10->id, 'cost_per_unit' => 22.00, 'current_stock' => 2.5, 'min_stock_level' => 2, 'max_stock_level' => 10, 'reorder_point' => 4], // LOW STOCK

            // Bakery (SUP-011)
            ['code' => 'BAK-001', 'name' => 'All-Purpose Flour', 'category' => 'bakery', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup11->id, 'cost_per_unit' => 1.20, 'current_stock' => 120, 'min_stock_level' => 20, 'max_stock_level' => 200, 'reorder_point' => 40],
            ['code' => 'BAK-002', 'name' => 'Bread Flour', 'category' => 'bakery', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup11->id, 'cost_per_unit' => 1.50, 'current_stock' => 85, 'min_stock_level' => 15, 'max_stock_level' => 150, 'reorder_point' => 30],
            ['code' => 'BAK-003', 'name' => 'Yeast', 'category' => 'bakery', 'unit_id' => $gUnit->id, 'supplier_id' => $sup11->id, 'cost_per_unit' => 0.05, 'current_stock' => 2500, 'min_stock_level' => 500, 'max_stock_level' => 5000, 'reorder_point' => 1000],
            ['code' => 'BAK-004', 'name' => 'Baking Powder', 'category' => 'bakery', 'unit_id' => $gUnit->id, 'supplier_id' => $sup11->id, 'cost_per_unit' => 0.03, 'current_stock' => 1800, 'min_stock_level' => 300, 'max_stock_level' => 3000, 'reorder_point' => 600],

            // Frozen (SUP-012)
            ['code' => 'FRZ-001', 'name' => 'Frozen Peas', 'category' => 'frozen', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup12->id, 'cost_per_unit' => 3.50, 'current_stock' => 25, 'min_stock_level' => 5, 'max_stock_level' => 40, 'reorder_point' => 10],
            ['code' => 'FRZ-002', 'name' => 'Frozen Corn', 'category' => 'frozen', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup12->id, 'cost_per_unit' => 3.00, 'current_stock' => 30, 'min_stock_level' => 5, 'max_stock_level' => 40, 'reorder_point' => 10],
            ['code' => 'FRZ-003', 'name' => 'Frozen Mixed Vegetables', 'category' => 'frozen', 'unit_id' => $kgUnit->id, 'supplier_id' => $sup12->id, 'cost_per_unit' => 4.00, 'current_stock' => 22, 'min_stock_level' => 5, 'max_stock_level' => 35, 'reorder_point' => 10],
        ];

        foreach ($ingredients as $ingredient) {
            Ingredient::updateOrCreate(
                ['code' => $ingredient['code']],
                $ingredient
            );
        }

        $this->command->info('Created/Updated ' . count($ingredients) . ' ingredients with varied stock levels!');
    }
}

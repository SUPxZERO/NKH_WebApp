<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Ingredient;
use App\Models\Unit;
use App\Models\Supplier;

class IngredientSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure we have units and suppliers
        $kgUnit = Unit::firstOrCreate(['code' => 'kg'], ['name' => 'Kilogram', 'display_name' => 'Kilogram']);
        $lUnit = Unit::firstOrCreate(['code' => 'l'], ['name' => 'Liter', 'display_name' => 'Liter']);
        $unitUnit = Unit::firstOrCreate(['code' => 'unit'], ['name' => 'Unit', 'display_name' => 'Unit']);
        $gUnit = Unit::firstOrCreate(['code' => 'g'], ['name' => 'Gram', 'display_name' => 'Gram']);

        $suppliers = Supplier::take(3)->get();
        if ($suppliers->count() == 0) {
            $suppliers = collect([
                Supplier::create(['code' => 'SUP-001', 'name' => 'Fresh Foods Co.', 'type' => 'produce', 'email' => 'orders@freshfoods.com', 'phone' => '1234567890', 'address' => '123 Market St']),
                Supplier::create(['code' => 'SUP-002', 'name' => 'Dairy Delights', 'type' => 'dairy', 'email' => 'sales@dairydelights.com', 'phone' => '0987654321', 'address' => '456 Farm Rd']),
                Supplier::create(['code' => 'SUP-003', 'name' => 'Meat Masters', 'type' => 'meat', 'email' => 'info@meatmasters.com', 'phone' => '5551234567', 'address' => '789 Butcher Lane']),
            ]);
        }

        // Ensure we have at least 3 suppliers
        while ($suppliers->count() < 3) {
            $count = $suppliers->count() + 1;
            $suppliers->push(Supplier::create([
                'code' => 'SUP-' . str_pad($count, 3, '0', STR_PAD_LEFT),
                'name' => 'Supplier ' . $count,
                'type' => 'general',
                'email' => 'supplier' . $count . '@example.com',
                'phone' => '555000000' . $count,
                'address' => 'Address ' . $count
            ]));
        }

        $ingredients = [
            // Vegetables
            ['code' => 'VEG-001', 'name' => 'Tomatoes', 'category' => 'vegetables', 'unit_id' => $kgUnit->id, 'supplier_id' => $suppliers[0]->id, 'cost_per_unit' => 3.50, 'current_stock' => 25, 'min_stock_level' => 5, 'max_stock_level' => 50, 'reorder_point' => 10],
            ['code' => 'VEG-002', 'name' => 'Lettuce', 'category' => 'vegetables', 'unit_id' => $kgUnit->id, 'supplier_id' => $suppliers[0]->id, 'cost_per_unit' => 2.80, 'current_stock' => 15, 'min_stock_level' => 5, 'max_stock_level' => 30, 'reorder_point' => 8],
            ['code' => 'VEG-003', 'name' => 'Onions', 'category' => 'vegetables', 'unit_id' => $kgUnit->id, 'supplier_id' => $suppliers[0]->id, 'cost_per_unit' => 1.50, 'current_stock' => 40, 'min_stock_level' => 10, 'max_stock_level' => 60, 'reorder_point' => 15],
            
            // Dairy
            ['code' => 'DAI-001', 'name' => 'Whole Milk', 'category' => 'dairy', 'unit_id' => $lUnit->id, 'supplier_id' => $suppliers[1]->id, 'cost_per_unit' => 1.20, 'current_stock' => 50, 'min_stock_level' => 10, 'max_stock_level' => 100, 'reorder_point' => 20, 'shelf_life_days' => 7],
            ['code' => 'DAI-002', 'name' => 'Cheddar Cheese', 'category' => 'dairy', 'unit_id' => $kgUnit->id, 'supplier_id' => $suppliers[1]->id, 'cost_per_unit' => 8.50, 'current_stock' => 12, 'min_stock_level' => 3, 'max_stock_level' => 25, 'reorder_point' => 5, 'allergens' => 'dairy'],
            ['code' => 'DAI-003', 'name' => 'Heavy Cream', 'category' => 'dairy', 'unit_id' => $lUnit->id, 'supplier_id' => $suppliers[1]->id, 'cost_per_unit' => 4.20, 'current_stock' => 8, 'min_stock_level' => 2, 'max_stock_level' => 20, 'reorder_point' => 4],
            
            // Meat
            ['code' => 'MEA-001', 'name' => 'Chicken Breast', 'category' => 'meat', 'unit_id' => $kgUnit->id, 'supplier_id' => $suppliers[2]->id, 'cost_per_unit' => 12.50, 'current_stock' => 30, 'min_stock_level' => 10, 'max_stock_level' => 50, 'reorder_point' => 15, 'storage_requirements' => 'Keep refrigerated at 4°C'],
            ['code' => 'MEA-002', 'name' => 'Ground Beef', 'category' => 'meat', 'unit_id' => $kgUnit->id, 'supplier_id' => $suppliers[2]->id, 'cost_per_unit' => 15.00, 'current_stock' => 4, 'min_stock_level' => 5, 'max_stock_level' => 40, 'reorder_point' => 10, 'storage_requirements' => 'Keep frozen at -18°C'],
            ['code' => 'MEA-003', 'name' => 'Salmon Fillets', 'category' => 'seafood', 'unit_id' => $kgUnit->id, 'supplier_id' => $suppliers[2]->id, 'cost_per_unit' => 22.00, 'current_stock' => 8, 'min_stock_level' => 3, 'max_stock_level' => 20, 'reorder_point' => 6],
            
            // Grains
            ['code' => 'GRA-001', 'name' => 'Rice', 'category' => 'grains', 'unit_id' => $kgUnit->id, 'supplier_id' => $suppliers[0]->id, 'cost_per_unit' => 2.50, 'current_stock' => 100, 'min_stock_level' => 20, 'max_stock_level' => 200, 'reorder_point' => 40],
            ['code' => 'GRA-002', 'name' => 'Pasta', 'category' => 'grains', 'unit_id' => $kgUnit->id, 'supplier_id' => $suppliers[0]->id, 'cost_per_unit' => 3.00, 'current_stock' => 60, 'min_stock_level' => 15, 'max_stock_level' => 100, 'reorder_point' => 25, 'allergens' => 'gluten'],
            
            // Spices
            ['code' => 'SPI-001', 'name' => 'Black Pepper', 'category' => 'spices', 'unit_id' => $gUnit->id, 'supplier_id' => $suppliers[0]->id, 'cost_per_unit' => 0.05, 'current_stock' => 500, 'min_stock_level' => 100, 'max_stock_level' => 1000, 'reorder_point' => 200],
            ['code' => 'SPI-002', 'name' => 'Sea Salt', 'category' => 'spices', 'unit_id' => $gUnit->id, 'supplier_id' => $suppliers[0]->id, 'cost_per_unit' => 0.02, 'current_stock' => 800, 'min_stock_level' => 200, 'max_stock_level' => 1500, 'reorder_point' => 300],
            
            // Oils
            ['code' => 'OIL-001', 'name' => 'Olive Oil', 'category' => 'oils', 'unit_id' => $lUnit->id, 'supplier_id' => $suppliers[0]->id, 'cost_per_unit' => 8.00, 'current_stock' => 20, 'min_stock_level' => 5, 'max_stock_level' => 40, 'reorder_point' => 10],
            ['code' => 'OIL-002', 'name' => 'Vegetable Oil', 'category' => 'oils', 'unit_id' => $lUnit->id, 'supplier_id' => $suppliers[0]->id, 'cost_per_unit' => 5.50, 'current_stock' => 3, 'min_stock_level' => 3, 'max_stock_level' => 30, 'reorder_point' => 8],
            
            // Beverages
            ['code' => 'BEV-001', 'name' => 'Orange Juice', 'category' => 'beverages', 'unit_id' => $lUnit->id, 'supplier_id' => $suppliers[0]->id, 'cost_per_unit' => 3.50, 'current_stock' => 25, 'min_stock_level' => 10, 'max_stock_level' => 50, 'reorder_point' => 15, 'shelf_life_days' => 14],
            ['code' => 'BEV-002', 'name' => 'Coffee Beans', 'category' => 'beverages', 'unit_id' => $kgUnit->id, 'supplier_id' => $suppliers[0]->id, 'cost_per_unit' => 18.00, 'current_stock' => 10, 'min_stock_level' => 2, 'max_stock_level' => 25, 'reorder_point' => 5],
        ];

        foreach ($ingredients as $ingredient) {
            Ingredient::create($ingredient);
        }

        $this->command->info('Created ' . count($ingredients) . ' ingredients!');
    }
}

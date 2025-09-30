<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Ingredient;
use App\Models\Location;

class IngredientSeeder extends Seeder
{
    public function run(): void
    {
        $locations = Location::all();
        
        $ingredients = [
            // Proteins
            ['sku' => 'BEEF-001', 'name' => 'Premium Beef', 'unit' => 'kg', 'quantity_on_hand' => 25.5, 'reorder_level' => 10.0, 'reorder_quantity' => 30.0, 'cost' => 18.50],
            ['sku' => 'PORK-001', 'name' => 'Fresh Pork', 'unit' => 'kg', 'quantity_on_hand' => 18.0, 'reorder_level' => 8.0, 'reorder_quantity' => 25.0, 'cost' => 12.00],
            ['sku' => 'CHKN-001', 'name' => 'Free Range Chicken', 'unit' => 'kg', 'quantity_on_hand' => 22.0, 'reorder_level' => 12.0, 'reorder_quantity' => 30.0, 'cost' => 8.50],
            ['sku' => 'FISH-001', 'name' => 'Fresh River Fish', 'unit' => 'kg', 'quantity_on_hand' => 15.5, 'reorder_level' => 8.0, 'reorder_quantity' => 20.0, 'cost' => 14.00],
            ['sku' => 'PRWN-001', 'name' => 'Fresh Prawns', 'unit' => 'kg', 'quantity_on_hand' => 8.0, 'reorder_level' => 5.0, 'reorder_quantity' => 15.0, 'cost' => 22.00],
            ['sku' => 'TOFU-001', 'name' => 'Silken Tofu', 'unit' => 'kg', 'quantity_on_hand' => 12.0, 'reorder_level' => 6.0, 'reorder_quantity' => 20.0, 'cost' => 3.50],

            // Vegetables
            ['sku' => 'VEG-001', 'name' => 'Green Papaya', 'unit' => 'kg', 'quantity_on_hand' => 35.0, 'reorder_level' => 15.0, 'reorder_quantity' => 40.0, 'cost' => 2.50],
            ['sku' => 'VEG-002', 'name' => 'Tomatoes', 'unit' => 'kg', 'quantity_on_hand' => 28.0, 'reorder_level' => 12.0, 'reorder_quantity' => 35.0, 'cost' => 3.00],
            ['sku' => 'VEG-003', 'name' => 'Morning Glory', 'unit' => 'kg', 'quantity_on_hand' => 20.0, 'reorder_level' => 10.0, 'reorder_quantity' => 25.0, 'cost' => 1.80],
            ['sku' => 'VEG-004', 'name' => 'Bean Sprouts', 'unit' => 'kg', 'quantity_on_hand' => 15.0, 'reorder_level' => 8.0, 'reorder_quantity' => 20.0, 'cost' => 2.00],
            ['sku' => 'VEG-005', 'name' => 'Lotus Stem', 'unit' => 'kg', 'quantity_on_hand' => 8.5, 'reorder_level' => 5.0, 'reorder_quantity' => 12.0, 'cost' => 4.50],
            ['sku' => 'VEG-006', 'name' => 'Lolot Leaves', 'unit' => 'kg', 'quantity_on_hand' => 5.0, 'reorder_level' => 3.0, 'reorder_quantity' => 8.0, 'cost' => 6.00],
            ['sku' => 'VEG-007', 'name' => 'Banana Leaves', 'unit' => 'unit', 'quantity_on_hand' => 50, 'reorder_level' => 20, 'reorder_quantity' => 60, 'cost' => 0.50],

            // Herbs & Spices
            ['sku' => 'HERB-001', 'name' => 'Fresh Ginger', 'unit' => 'kg', 'quantity_on_hand' => 8.0, 'reorder_level' => 4.0, 'reorder_quantity' => 10.0, 'cost' => 5.50],
            ['sku' => 'HERB-002', 'name' => 'Lemongrass', 'unit' => 'kg', 'quantity_on_hand' => 6.5, 'reorder_level' => 3.0, 'reorder_quantity' => 8.0, 'cost' => 4.00],
            ['sku' => 'HERB-003', 'name' => 'Galangal', 'unit' => 'kg', 'quantity_on_hand' => 4.0, 'reorder_level' => 2.0, 'reorder_quantity' => 6.0, 'cost' => 7.00],
            ['sku' => 'HERB-004', 'name' => 'Kaffir Lime Leaves', 'unit' => 'kg', 'quantity_on_hand' => 2.5, 'reorder_level' => 1.0, 'reorder_quantity' => 4.0, 'cost' => 12.00],
            ['sku' => 'HERB-005', 'name' => 'Thai Basil', 'unit' => 'kg', 'quantity_on_hand' => 3.0, 'reorder_level' => 1.5, 'reorder_quantity' => 5.0, 'cost' => 8.00],
            ['sku' => 'HERB-006', 'name' => 'Cilantro', 'unit' => 'kg', 'quantity_on_hand' => 4.5, 'reorder_level' => 2.0, 'reorder_quantity' => 6.0, 'cost' => 6.50],
            ['sku' => 'SPICE-001', 'name' => 'Turmeric Powder', 'unit' => 'kg', 'quantity_on_hand' => 5.0, 'reorder_level' => 2.0, 'reorder_quantity' => 8.0, 'cost' => 15.00],
            ['sku' => 'SPICE-002', 'name' => 'Chili Powder', 'unit' => 'kg', 'quantity_on_hand' => 6.0, 'reorder_level' => 3.0, 'reorder_quantity' => 10.0, 'cost' => 12.00],

            // Pantry Items
            ['sku' => 'PANT-001', 'name' => 'Jasmine Rice', 'unit' => 'kg', 'quantity_on_hand' => 150.0, 'reorder_level' => 50.0, 'reorder_quantity' => 200.0, 'cost' => 1.20],
            ['sku' => 'PANT-002', 'name' => 'Rice Noodles', 'unit' => 'kg', 'quantity_on_hand' => 45.0, 'reorder_level' => 20.0, 'reorder_quantity' => 60.0, 'cost' => 2.80],
            ['sku' => 'PANT-003', 'name' => 'Coconut Milk', 'unit' => 'l', 'quantity_on_hand' => 25.0, 'reorder_level' => 12.0, 'reorder_quantity' => 35.0, 'cost' => 3.50],
            ['sku' => 'PANT-004', 'name' => 'Fish Sauce', 'unit' => 'l', 'quantity_on_hand' => 18.0, 'reorder_level' => 8.0, 'reorder_quantity' => 25.0, 'cost' => 4.20],
            ['sku' => 'PANT-005', 'name' => 'Soy Sauce', 'unit' => 'l', 'quantity_on_hand' => 22.0, 'reorder_level' => 10.0, 'reorder_quantity' => 30.0, 'cost' => 3.80],
            ['sku' => 'PANT-006', 'name' => 'Oyster Sauce', 'unit' => 'l', 'quantity_on_hand' => 15.0, 'reorder_level' => 8.0, 'reorder_quantity' => 20.0, 'cost' => 5.50],
            ['sku' => 'PANT-007', 'name' => 'Tamarind Paste', 'unit' => 'kg', 'quantity_on_hand' => 8.0, 'reorder_level' => 4.0, 'reorder_quantity' => 12.0, 'cost' => 6.80],
            ['sku' => 'PANT-008', 'name' => 'Palm Sugar', 'unit' => 'kg', 'quantity_on_hand' => 12.0, 'reorder_level' => 6.0, 'reorder_quantity' => 18.0, 'cost' => 4.50],

            // Fruits
            ['sku' => 'FRUIT-001', 'name' => 'Fresh Mangoes', 'unit' => 'kg', 'quantity_on_hand' => 20.0, 'reorder_level' => 10.0, 'reorder_quantity' => 30.0, 'cost' => 3.20],
            ['sku' => 'FRUIT-002', 'name' => 'Oranges', 'unit' => 'kg', 'quantity_on_hand' => 25.0, 'reorder_level' => 12.0, 'reorder_quantity' => 35.0, 'cost' => 2.80],
            ['sku' => 'FRUIT-003', 'name' => 'Watermelon', 'unit' => 'kg', 'quantity_on_hand' => 40.0, 'reorder_level' => 20.0, 'reorder_quantity' => 60.0, 'cost' => 1.50],
            ['sku' => 'FRUIT-004', 'name' => 'Limes', 'unit' => 'kg', 'quantity_on_hand' => 15.0, 'reorder_level' => 8.0, 'reorder_quantity' => 20.0, 'cost' => 4.00],

            // Dairy & Eggs
            ['sku' => 'DAIRY-001', 'name' => 'Fresh Eggs', 'unit' => 'unit', 'quantity_on_hand' => 200, 'reorder_level' => 100, 'reorder_quantity' => 300, 'cost' => 0.25],
            ['sku' => 'DAIRY-002', 'name' => 'Condensed Milk', 'unit' => 'l', 'quantity_on_hand' => 20.0, 'reorder_level' => 10.0, 'reorder_quantity' => 30.0, 'cost' => 3.80],
            ['sku' => 'DAIRY-003', 'name' => 'Heavy Cream', 'unit' => 'l', 'quantity_on_hand' => 12.0, 'reorder_level' => 6.0, 'reorder_quantity' => 18.0, 'cost' => 5.20],

            // Beverages
            ['sku' => 'BEV-001', 'name' => 'Cambodian Coffee Beans', 'unit' => 'kg', 'quantity_on_hand' => 15.0, 'reorder_level' => 8.0, 'reorder_quantity' => 25.0, 'cost' => 12.50],
            ['sku' => 'BEV-002', 'name' => 'Jasmine Tea Leaves', 'unit' => 'kg', 'quantity_on_hand' => 8.0, 'reorder_level' => 4.0, 'reorder_quantity' => 12.0, 'cost' => 18.00],
            ['sku' => 'BEV-003', 'name' => 'Angkor Beer', 'unit' => 'unit', 'quantity_on_hand' => 120, 'reorder_level' => 50, 'reorder_quantity' => 200, 'cost' => 1.20],

            // Low Stock Items (for testing alerts)
            ['sku' => 'LOW-001', 'name' => 'Premium Olive Oil', 'unit' => 'l', 'quantity_on_hand' => 2.0, 'reorder_level' => 5.0, 'reorder_quantity' => 15.0, 'cost' => 25.00],
            ['sku' => 'LOW-002', 'name' => 'Sea Salt', 'unit' => 'kg', 'quantity_on_hand' => 1.5, 'reorder_level' => 3.0, 'reorder_quantity' => 10.0, 'cost' => 8.50],
            ['sku' => 'OUT-001', 'name' => 'Black Pepper', 'unit' => 'kg', 'quantity_on_hand' => 0.0, 'reorder_level' => 2.0, 'reorder_quantity' => 8.0, 'cost' => 35.00],
        ];

        foreach ($locations as $location) {
            foreach ($ingredients as $ingredient) {
                Ingredient::create(array_merge($ingredient, [
                    'location_id' => $location->id,
                    'is_active' => $ingredient['quantity_on_hand'] > 0 ? true : ($ingredient['sku'] === 'OUT-001' ? true : true),
                ]));
            }
        }
    }
}

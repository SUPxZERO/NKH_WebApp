<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Inventory;
use App\Models\Ingredient;
use App\Models\Location;

class InventorySeeder extends Seeder
{
    public function run(): void
    {
        $locations = Location::all();
        $ingredients = Ingredient::all();

        if ($locations->count() == 0 || $ingredients->count() == 0) {
            $this->command->warn('Please run LocationSeeder and IngredientSeeder first!');
            return;
        }

        $inventoryRecords = [];

        // Distribute ingredients across locations with varying stock levels
        foreach ($ingredients as $ingredient) {
            foreach ($locations->take(2) as $index => $location) {
                // Main location gets more stock
                $stockMultiplier = $index == 0 ? 0.6 : 0.4;
                
                $inventoryRecords[] = [
                    'ingredient_id' => $ingredient->id,
                    'location_id' => $location->id,
                    'quantity' => round($ingredient->current_stock * $stockMultiplier, 3),
                    'batch_number' => 'BATCH-' . strtoupper(substr(md5($ingredient->id . $location->id), 0, 8)),
                    'expiration_date' => $ingredient->shelf_life_days 
                        ? now()->addDays($ingredient->shelf_life_days)->format('Y-m-d')
                        : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        // Create some expiring items (for alerts)
        $expiringIngredients = $ingredients->filter(fn($i) => $i->shelf_life_days !== null)->take(3);
        foreach ($expiringIngredients as $ingredient) {
            $location = $locations->random();
            $inventoryRecords[] = [
                'ingredient_id' => $ingredient->id,
                'location_id' => $location->id,
                'quantity' => 5,
                'batch_number' => 'BATCH-EXP-' . strtoupper(substr(md5(rand()), 0, 6)),
                'expiration_date' => now()->addDays(3)->format('Y-m-d'), // Expiring soon
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        Inventory::insert($inventoryRecords);

        $this->command->info('Created ' . count($inventoryRecords) . ' inventory records!');
    }
}

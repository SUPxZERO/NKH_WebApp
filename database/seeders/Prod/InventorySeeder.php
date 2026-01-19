<?php

namespace Database\Seeders\Prod;

use Illuminate\Database\Seeder;
use App\Models\Inventory;
use App\Models\Ingredient;
use App\Models\Location;

class InventorySeeder extends Seeder
{
    public function run(): void
    {
        $locations = Location::where('is_active', true)->get();
        $ingredients = Ingredient::all();

        if ($locations->isEmpty() || $ingredients->isEmpty()) {
            $this->command->warn('No active locations or ingredients found');
            return;
        }

        foreach ($locations as $location) {
            foreach ($ingredients as $ingredient) {
                // Distribute stock across locations with variety
                // 80% of max for main location, 60% for others
                $stockPercentage = $location->id === $locations->first()->id ? 0.80 : 0.60;
                $quantity = round($ingredient->max_stock_level * $stockPercentage, 2);

                // Create 2-4 batches per ingredient per location for variety
                $batchCount = rand(2, 4);
                $quantityPerBatch = $quantity / $batchCount;

                for ($i = 0; $i < $batchCount; $i++) {
                    // Vary the batch quantities slightly
                    $batchQty = $quantityPerBatch * (rand(80, 120) / 100);
                    
                    // Generate unique batch number
                    $batchNumber = 'BATCH-' . strtoupper(substr(md5($ingredient->code . $location->id . $i . time()), 0, 8));
                    
                    // Vary expiration dates
                    // 10% expiring soon (within 7 days)
                    // 20% expiring medium term (8-30 days)
                    // 70% expiring long term (31-90 days)
                    $rand = rand(1, 100);
                    if ($rand <= 10) {
                        // Expiring soon - within 7 days
                        $expirationDate = now()->addDays(rand(1, 7));
                    } elseif ($rand <= 30) {
                        // Medium term - 8-30 days
                        $expirationDate = now()->addDays(rand(8, 30));
                    } else {
                        // Long term - 31-90 days
                        $expirationDate = now()->addDays(rand(31, 90));
                    }

                    // For some categories, use shorter expiration
                    if (in_array($ingredient->category, ['seafood', 'dairy', 'meat'])) {
                        // Perishables: max 14 days
                        $expirationDate = now()->addDays(rand(3, 14));
                    } elseif (in_array($ingredient->category, ['vegetables'])) {
                        // Fresh produce: max 21 days
                        $expirationDate = now()->addDays(rand(5, 21));
                    }

                    Inventory::create([
                        'ingredient_id' => $ingredient->id,
                        'location_id' => $location->id,
                        'quantity' => $batchQty,
                        'batch_number' => $batchNumber,
                        'expiration_date' => $expirationDate,
                        'created_at' => now()->subDays(rand(1, 30)), // Received 1-30 days ago
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        $this->command->info('Created inventory records with varied batches and expiration dates!');
    }
}

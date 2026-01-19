<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\InventoryTransaction;
use App\Models\Ingredient;
use App\Models\Location;
use App\Models\User;
use Carbon\Carbon;

class InventoryTransactionSeeder extends Seeder
{
    public function run(): void
    {
        $ingredients = Ingredient::all();
        $locations = Location::all();
        $users = User::whereHas('roles', function($query) {
            $query->where('slug', 'manager');
        })->get();
        
        // Generate stock movements for the last 30 days
        $startDate = Carbon::now()->subDays(31);
        $endDate = Carbon::now();
        
        while ($startDate->lte($endDate)) {
            // Create 5-10 stock movements per day
            $movementsCount = rand(5, 15);
            
            for ($i = 0; $i < $movementsCount; $i++) {
                $ingredient = $ingredients->random();
                $location = $locations->random();
                // Safe user retrieval
                $user = $users->isNotEmpty() ? $users->random() : User::first();
                
                // Generate movement time between 6 AM and 10 PM
                $movementTime = $startDate->copy()
                    ->setHour(rand(6, 22))
                    ->setMinute(array_rand([0, 15, 30, 45]));

                $movType = $this->getMovementType();
                
                InventoryTransaction::create([
                    'ingredient_id' => $ingredient->id,
                    'location_id' => $location->id,
                    'user_id' => $user?->id,
                    'type' => $movType, // Populate type for reports
                    'movement_type' => $movType,
                    'quantity' => $this->getQuantity(),
                    'unit' => $ingredient->unit?->code ?? 'unit', // Safe access
                    'reference_type' => $this->getReferenceType(),
                    'reference_id' => rand(1, 100),
                    'notes' => $this->getNotes(),
                    'transacted_at' => $movementTime,
                    'created_at' => $movementTime,
                    'updated_at' => $movementTime,
                    'created_by' => $user?->id
                ]);
            }
            
            $startDate->addDay();
        }
    }

    private function getMovementType(): string
    {
        // Weighted random to favor usage for reports
        $rand = rand(1, 100);
        if ($rand <= 50) return 'usage'; // 50% usage
        if ($rand <= 70) return 'purchase';
        if ($rand <= 80) return 'waste';
        return 'adjustment';
    }

    private function getQuantity(): float
    {
        // Generate quantities between 0.1 and 100
        return rand(10, 500) / 10;
    }

    private function getReferenceType(): string
    {
        return array_rand([
            'purchase_order' => true,
            'order' => true,
            'stock_transfer' => true,
            'inventory_count' => true,
            'waste_record' => true
        ]);
    }

    private function getNotes(): ?string
    {
        $notes = [
            "Regular stock replenishment",
            "Emergency order",
            "Stock correction after count",
            "Damaged goods disposal",
            "Transfer between locations",
            null, null, null // Add nulls for variety
        ];

        return $notes[array_rand($notes)];
    }
}
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\StockMovement;
use App\Models\Ingredient;
use App\Models\Location;
use App\Models\User;
use Carbon\Carbon;

class StockMovementSeeder extends Seeder
{
    public function run(): void
    {
        $ingredients = Ingredient::all();
        $locations = Location::all();
        $users = User::where('role', 'inventory_manager')->get();
        
        // Generate stock movements for the last 30 days
        $startDate = Carbon::now()->subDays(30);
        $endDate = Carbon::now();
        
        while ($startDate->lte($endDate)) {
            // Create 5-10 stock movements per day
            $movementsCount = rand(5, 10);
            
            for ($i = 0; $i < $movementsCount; $i++) {
                $ingredient = $ingredients->random();
                $location = $locations->random();
                $user = $users->random();
                
                // Generate movement time between 6 AM and 10 PM
                $movementTime = $startDate->copy()
                    ->setHour(rand(6, 22))
                    ->setMinute(array_rand([0, 15, 30, 45]));
                
                StockMovement::create([
                    'ingredient_id' => $ingredient->id,
                    'location_id' => $location->id,
                    'user_id' => $user->id,
                    'movement_type' => $this->getMovementType(),
                    'quantity' => $this->getQuantity(),
                    'unit' => $ingredient->unit,
                    'reference_type' => $this->getReferenceType(),
                    'reference_id' => rand(1, 100),
                    'notes' => $this->getNotes(),
                    'created_at' => $movementTime,
                    'updated_at' => $movementTime,
                ]);
            }
            
            $startDate->addDay();
        }
    }

    private function getMovementType(): string
    {
        return array_rand([
            'purchase' => true,
            'usage' => true,
            'transfer' => true,
            'adjustment' => true,
            'waste' => true
        ]);
    }

    private function getQuantity(): float
    {
        // Generate quantities between 0.1 and 100
        return rand(1, 1000) / 10;
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
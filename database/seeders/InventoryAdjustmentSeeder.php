<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\InventoryAdjustment;
use App\Models\Ingredient;
use App\Models\Location;
use App\Models\User;

class InventoryAdjustmentSeeder extends Seeder
{
    public function run(): void
    {
        $ingredients = Ingredient::take(5)->get();
        $locations = Location::take(2)->get();
        $users = User::take(2)->get();

        if ($ingredients->count() == 0 || $locations->count() == 0 || $users->count() == 0) {
            $this->command->warn('Please run IngredientSeeder, LocationSeeder, and ensure users exist!');
            return;
        }

        $approverUser = $users->count() > 1 ? $users[1]->id : $users[0]->id;

        $adjustments = [
            // Pending adjustment
            [
                'ingredient_id' => $ingredients[0]->id,
                'location_id' => $locations[0]->id,
                'quantity_before' => 50,
                'quantity_after' => 45,
                'quantity_change' => -5,
                'reason' => 'count_error',
                'notes' => 'Physical count discrepancy found during monthly audit',
                'status' => 'pending',
                'adjusted_by' => $users[0]->id,
                'created_at' => now()->subDays(1),
                'updated_at' => now()->subDays(1),
            ],
            // Approved adjustment
            [
                'ingredient_id' => $ingredients[1]->id,
                'location_id' => $locations[0]->id,
                'quantity_before' => 30,
                'quantity_after' => 28,
                'quantity_change' => -2,
                'reason' => 'damaged',
                'notes' => 'Packaging damaged during delivery',
                'status' => 'approved',
                'adjusted_by' => $users[0]->id,
                'approved_by' => $approverUser,
                'approval_notes' => 'Approved. Will file claim with supplier.',
                'created_at' => now()->subDays(3),
                'updated_at' => now()->subDays(2),
            ],
            // Rejected adjustment
            [
                'ingredient_id' => $ingredients[2]->id,
                'location_id' => $locations[1]->id,
                'quantity_before' => 100,
                'quantity_after' => 80,
                'quantity_change' => -20,
                'reason' => 'spillage',
                'notes' => 'Claimed spillage during rush hour',
                'status' => 'rejected',
                'adjusted_by' => $users[0]->id,
                'approved_by' => $approverUser,
                'approval_notes' => 'Insufficient documentation. Need incident report.',
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(4),
            ],
            // Another pending
            [
                'ingredient_id' => $ingredients[3]->id,
                'location_id' => $locations[0]->id,
                'quantity_before' => 15,
                'quantity_after' => 20,
                'quantity_change' => 5,
                'reason' => 'correction',
                'notes' => 'Found additional stock in back storage',
                'status' => 'pending',
                'adjusted_by' => $users[0]->id,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Approved expired adjustment
            [
                'ingredient_id' => $ingredients[4]->id,
                'location_id' => $locations[1]->id,
                'quantity_before' => 25,
                'quantity_after' => 22,
                'quantity_change' => -3,
                'reason' => 'expired',
                'notes' => 'Items past expiration date removed',
                'status' => 'approved',
                'adjusted_by' => $users[0]->id,
                'approved_by' => $approverUser,
                'approval_notes' => 'Approved. Ensure FIFO practices.',
                'created_at' => now()->subWeek(),
                'updated_at' => now()->subDays(6),
            ],
        ];

        foreach ($adjustments as $adjustment) {
            InventoryAdjustment::create($adjustment);
        }

        $this->command->info('Created ' . count($adjustments) . ' inventory adjustments!');
    }
}

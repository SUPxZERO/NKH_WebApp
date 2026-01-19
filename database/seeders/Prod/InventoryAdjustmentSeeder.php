<?php

namespace Database\Seeders\Prod;

use Illuminate\Database\Seeder;
use App\Models\InventoryAdjustment;
use App\Models\Ingredient;
use App\Models\Location;
use App\Models\User;

class InventoryAdjustmentSeeder extends Seeder
{
    public function run(): void
    {
        $locations = Location::where('is_active', true)->get();
        $ingredients = Ingredient::all();
        $adminUser = User::where('email', 'admin@nkh.com')->first() ?? User::first();

        if ($locations->isEmpty() || $ingredients->isEmpty() || !$adminUser) {
            $this->command->warn('Missing required data for InventoryAdjustmentSeeder');
            return;
        }

        $location = $locations->first();

        // Create 30 inventory adjustments with various reasons and statuses
        $adjustmentConfigs = [
            // Approved adjustments - Recent
            ['status' => 'approved', 'reason' => 'damaged_goods', 'type' => 'decrease', 'daysAgo' => 1, 'notes' => 'Damaged during delivery - supplier notified'],
            ['status' => 'approved', 'reason' => 'expired', 'type' => 'decrease', 'daysAgo' => 2, 'notes' => 'Past expiration date - disposed per food safety protocol'],
            ['status' => 'approved', 'reason' => 'stock_correction', 'type' => 'increase', 'daysAgo' => 3, 'notes' => 'Physical count higher than system - correcting discrepancy'],
            ['status' => 'approved', 'reason' => 'spillage', 'type' => 'decrease', 'daysAgo' => 4, 'notes' => 'Accidental spillage in storage area'],
            ['status' => 'approved', 'reason' => 'theft', 'type' => 'decrease', 'daysAgo' => 5, 'notes' => 'Inventory shrinkage detected - security review initiated'],
            ['status' => 'approved', 'reason' => 'stock_correction', 'type' => 'decrease', 'daysAgo' => 6, 'notes' => 'Physical count lower than system - correcting error'],
            ['status' => 'approved', 'reason' => 'quality_issue', 'type' => 'decrease', 'daysAgo' => 7, 'notes' => 'Quality below standards - returned to supplier'],
            ['status' => 'approved', 'reason' => 'damaged_goods', 'type' => 'decrease', 'daysAgo' => 8, 'notes' => 'Freezer malfunction - items thawed and unsafe'],
            ['status' => 'approved', 'reason' => 'expired', 'type' => 'decrease', 'daysAgo' => 10, 'notes' => 'Expired items removed during weekly inspection'],
            ['status' => 'approved', 'reason' => 'stock_correction', 'type' => 'increase', 'daysAgo' => 12, 'notes' => 'Found additional stock in secondary storage'],
            
            // Approved adjustments - Older
            ['status' => 'approved', 'reason' => 'spillage', 'type' => 'decrease', 'daysAgo' => 15, 'notes' => 'Oil container leaked overnight'],
            ['status' => 'approved', 'reason' => 'damaged_goods', 'type' => 'decrease', 'daysAgo' => 18, 'notes' => 'Packaging compromised - contents contaminated'],
            ['status' => 'approved', 'reason' => 'stock_correction', 'type' => 'decrease', 'daysAgo' => 20, 'notes' => 'Monthly inventory reconciliation'],
            ['status' => 'approved', 'reason' => 'expired', 'type' => 'decrease', 'daysAgo' => 22, 'notes' => 'Expired dairy products disposed'],
            ['status' => 'approved', 'reason' => 'quality_issue', 'type' => 'decrease', 'daysAgo' => 25, 'notes' => 'Vegetables wilted - not suitable for service'],
            ['status' => 'approved', 'reason' => 'stock_correction', 'type' => 'increase', 'daysAgo' => 28, 'notes' => 'Inventory count adjustment after audit'],
            ['status' => 'approved', 'reason' => 'damaged_goods', 'type' => 'decrease', 'daysAgo' => 30, 'notes' => 'Broken containers during restocking'],
            
            // Pending adjustments (awaiting approval)
            ['status' => 'pending', 'reason' => 'stock_correction', 'type' => 'decrease', 'daysAgo' => 0, 'notes' => 'Discrepancy found during today\'s count - needs manager review'],
            ['status' => 'pending', 'reason' => 'damaged_goods', 'type' => 'decrease', 'daysAgo' => 1, 'notes' => 'Damaged packaging - awaiting inspection'],
            ['status' => 'pending', 'reason' => 'stock_correction', 'type' => 'increase', 'daysAgo' => 1, 'notes' => 'Found unreported stock - verifying source'],
            ['status' => 'pending', 'reason' => 'expired', 'type' => 'decrease', 'daysAgo' => 0, 'notes' => 'Items expiring today - pending disposal approval'],
            ['status' => 'pending', 'reason' => 'quality_issue', 'type' => 'decrease', 'daysAgo' => 2, 'notes' => 'Questionable quality - awaiting chef inspection'],
            ['status' => 'pending', 'reason' => 'spillage', 'type' => 'decrease', 'daysAgo' => 0, 'notes' => 'Minor spillage - calculating exact loss'],
            
            // Rejected adjustments
            ['status' => 'rejected', 'reason' => 'stock_correction', 'type' => 'decrease', 'daysAgo' => 5, 'notes' => 'Rejected - recount showed no discrepancy'],
            ['status' => 'rejected', 'reason' => 'damaged_goods', 'type' => 'decrease', 'daysAgo' => 8, 'notes' => 'Rejected - items actually usable after inspection'],
            ['status' => 'rejected', 'reason' => 'quality_issue', 'type' => 'decrease', 'daysAgo' => 10, 'notes' => 'Rejected - quality deemed acceptable by head chef'],
            ['status' => 'rejected', 'reason' => 'stock_correction', 'type' => 'increase', 'daysAgo' => 12, 'notes' => 'Rejected - could not verify source of additional stock'],
            
            // Additional variety
            ['status' => 'approved', 'reason' => 'theft', 'type' => 'decrease', 'daysAgo' => 35, 'notes' => 'Inventory shrinkage - security measures enhanced'],
            ['status' => 'approved', 'reason' => 'stock_correction', 'type' => 'decrease', 'daysAgo' => 40, 'notes' => 'Quarterly inventory audit adjustment'],
            ['status' => 'pending', 'reason' => 'damaged_goods', 'type' => 'decrease', 'daysAgo' => 0, 'notes' => 'Delivery damage - documenting for supplier claim'],
        ];

        foreach ($adjustmentConfigs as $config) {
            $ingredient = $ingredients->random();
            $adjustmentDate = now()->subDays($config['daysAgo']);
            
            // Determine quantity based on ingredient type and adjustment reason
            $baseStock = $ingredient->current_stock;
            if ($config['type'] === 'decrease') {
                // Decrease: 5-30% of current stock
                $quantity = -1 * round($baseStock * (rand(5, 30) / 100), 2);
                // Ensure we don't go below 0.1
                if (abs($quantity) < 0.1) {
                    $quantity = -0.5;
                }
            } else {
                // Increase: 10-50% of current stock
                $quantity = round($baseStock * (rand(10, 50) / 100), 2);
                if ($quantity < 0.1) {
                    $quantity = 2.0;
                }
            }

            // Determine approver for approved/rejected items
            $approvedBy = null;
            $approvedAt = null;
            if ($config['status'] === 'approved') {
                $approvedBy = $adminUser->id;
                $approvedAt = $adjustmentDate->copy()->addHours(rand(2, 24));
            } elseif ($config['status'] === 'rejected') {
                $approvedBy = $adminUser->id;
                $approvedAt = $adjustmentDate->copy()->addHours(rand(1, 12));
            }
            
            // Calculate before/after quantities
            $qtyBefore = $ingredient->current_stock;
            $qtyAfter = $qtyBefore + $quantity;

            InventoryAdjustment::create([
                'location_id' => $location->id,
                'ingredient_id' => $ingredient->id,
                'adjusted_by' => $adminUser->id,
                'approved_by' => $approvedBy,
                'quantity_before' => $qtyBefore,
                'quantity_after' => $qtyAfter,
                'quantity_change' => $quantity,
                'reason' => $config['reason'],
                'status' => $config['status'],
                'notes' => $config['notes'],
                'approved_at' => $approvedAt,
                'created_at' => $adjustmentDate,
                'updated_at' => $approvedAt ?? $adjustmentDate,
            ]);
        }

        $this->command->info('Created ' . count($adjustmentConfigs) . ' inventory adjustments with varied statuses and reasons!');
    }
}

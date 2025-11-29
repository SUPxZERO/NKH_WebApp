<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\StockAlert;
use App\Models\Ingredient;
use App\Models\Location;

class StockAlertSeeder extends Seeder
{
    public function run(): void
    {
        $ingredients = Ingredient::all();
        $locations = Location::all();

        if ($ingredients->count() == 0) {
            $this->command->warn('Please run IngredientSeeder first!');
            return;
        }

        $alerts = [];

        // Low stock alerts (current_stock <= reorder_point)
        $lowStockIngredients = $ingredients->filter(function($ingredient) {
            return $ingredient->current_stock <= $ingredient->reorder_point;
        });

        foreach ($lowStockIngredients->take(3) as $ingredient) {
            $alerts[] = [
                'type' => 'low_stock',
                'ingredient_id' => $ingredient->id,
                'location_id' => null,
                'severity' => 'medium',
                'message' => "Stock level ({$ingredient->current_stock}) is below reorder point ({$ingredient->reorder_point})",
                'acknowledged' => false,
                'created_at' => now()->subHours(rand(1, 48)),
                'updated_at' => now()->subHours(rand(1, 48)),
            ];
        }

        // Critical stock alerts (current_stock <= min_stock_level)
        $criticalIngredients = $ingredients->filter(function($ingredient) {
            return $ingredient->current_stock <= $ingredient->min_stock_level;
        });

        foreach ($criticalIngredients->take(2) as $ingredient) {
            $alerts[] = [
                'type' => 'critical_stock',
                'ingredient_id' => $ingredient->id,
                'location_id' => null,
                'severity' => 'high',
                'message' => "CRITICAL: Stock level ({$ingredient->current_stock}) is at or below minimum ({$ingredient->min_stock_level})",
                'acknowledged' => false,
                'created_at' => now()->subHours(rand(1, 24)),
                'updated_at' => now()->subHours(rand(1, 24)),
            ];
        }

        // Expiring soon alerts
        $expiringIngredients = $ingredients->filter(fn($i) => $i->shelf_life_days !== null)->take(2);
        foreach ($expiringIngredients as $ingredient) {
            $location = $locations->random();
            $alerts[] = [
                'type' => 'expiring_soon',
                'ingredient_id' => $ingredient->id,
                'location_id' => $location->id,
                'severity' => 'medium',
                'message' => "Items expiring within 7 days. Check inventory at {$location->name}",
                'acknowledged' => false,
                'created_at' => now()->subHours(rand(1, 72)),
                'updated_at' => now()->subHours(rand(1, 72)),
            ];
        }

        // One acknowledged alert (old)
        if ($ingredients->count() > 5) {
            $alerts[] = [
                'type' => 'low_stock',
                'ingredient_id' => $ingredients[5]->id,
                'location_id' => null,
                'severity' => 'low',
                'message' => "Previously low stock - now resolved",
                'acknowledged' => true,
                'acknowledged_at' => now()->subDays(2),
                'acknowledged_by' => 1,
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(2),
            ];
        }

        foreach ($alerts as $alert) {
            StockAlert::create($alert);
        }

        $this->command->info('Created ' . count($alerts) . ' stock alerts!');
    }
}

<?php

namespace Database\Seeders\Prod;

use Illuminate\Database\Seeder;
use App\Models\MenuItem;
use App\Models\Ingredient;
use App\Models\Recipe;
use App\Models\Unit;

class RecipeSeeder extends Seeder
{
    private $ingredients;
    private $units;

    public function run(): void
    {
        // Cache ingredients and units for performance
        $this->ingredients = Ingredient::all()->keyBy('code');
        $this->units = Unit::all()->keyBy('code');

        $menuItems = MenuItem::where('is_active', true)->get();

        foreach ($menuItems as $item) {
            $this->createRecipeFor($item);
        }
    }

    private function createRecipeFor(MenuItem $item)
    {
        // 1. Determine Ingredients based on keywords
        $recipeData = $this->guessIngredients($item->slug, $item->name);
        
        if (empty($recipeData['ingredients'])) {
            return;
        }

        // 2. Create Recipe Header
        $recipe = Recipe::updateOrCreate(
            ['menu_item_id' => $item->id],
            [
                'name' => 'Standard Recipe: ' . $item->name,
                'description' => 'Auto-generated recipe based on standard portion sizing.',
                'instructions' => "1. Prep ingredients.\n2. Cook according to standard procedure.\n3. Garnish and serve.",
                'prep_time_minutes' => $item->prep_time ?? 15,
                'cook_time_minutes' => $item->cook_time ?? 10,
                'servings' => 1,
                'yield_portions' => 1,
                'is_active' => true,
            ]
        );

        // 3. Sync Ingredients
        $totalCost = 0;
        foreach ($recipeData['ingredients'] as $ingCode => $quantity) {
            $ingredient = $this->ingredients->get($ingCode);
            if (!$ingredient) continue;

            // Determine unit (simple logic: kg for bulk, unit for count)
            $unitCode = 'kg'; // Default
            if (in_array($ingCode, ['PRT-005'])) $unitCode = 'unit'; // Eggs
            if (str_starts_with($ingCode, 'DRY') || str_starts_with($ingCode, 'OIL')) $unitCode = 'l'; // Liquids ideally

            // Convert quantity to match ingredient unit if needed (simplified)
            // Assuming the guessIngredients returns quantity in the ingredient's base unit for simplicity
            
            $recipe->ingredients()->updateOrCreate(
                ['ingredient_id' => $ingredient->id],
                [
                    'quantity' => $quantity,
                    'unit' => $ingredient->unit->code ?? 'unit', // Use ingredient's base unit
                    'notes' => 'Standard portion'
                ]
            );

            $totalCost += $ingredient->cost_per_unit * $quantity;
        }

        // 4. Update Costs
        $recipe->update(['total_cost' => $totalCost]);
        $item->update(['cost' => $totalCost]);
    }

    private function guessIngredients(string $slug, string $name): array
    {
        $ingredients = [];
        
        // --- BASE STARCHES ---
        if (str_contains($slug, 'rice') && !str_contains($slug, 'noodle')) {
            $ingredients['RIC-001'] = 0.200; // 200g Rice
        }
        if (str_contains($slug, 'fried-rice')) {
            $ingredients['RIC-001'] = 0.250; // More rice
            $ingredients['PRT-005'] = 1;     // 1 Egg
            $ingredients['VEG-003'] = 0.030; // 30g Onion
            $ingredients['DRY-002'] = 0.015; // 15ml Soy Sauce
            $ingredients['OIL-001'] = 0.020; // 20g Oil
        }
        if (str_contains($slug, 'noodle') || str_contains($slug, 'pho') || str_contains($slug, 'kuy-teav')) {
            $ingredients['RIC-002'] = 0.150; // 150g Rice Noodles (Dry/Wet avg)
            $ingredients['VEG-007'] = 0.050; // 50g Bok Choy/Greens
        }
        if (str_contains($slug, 'chow-mein')) {
             $ingredients['RIC-003'] = 0.150; // Egg Noodles
        }

        // --- PROTEINS ---
        if (str_contains($slug, 'chicken')) {
            $ingredients['PRT-001'] = 0.150; // 150g Chicken
        }
        if (str_contains($slug, 'pork') || str_contains($slug, 'dumpling')) {
            $ingredients['PRT-002'] = 0.150; // 150g Pork
        }
        if (str_contains($slug, 'beef') || str_contains($slug, 'steak') || str_contains($slug, 'lok-lak')) {
             $ingredients['PRT-003'] = 0.180; // 180g Beef
        }
        if (str_contains($slug, 'duck')) {
             $ingredients['PRT-004'] = 0.250; // 250g Duck (bone-in approx)
        }
        if (str_contains($slug, 'shrimp') || str_contains($slug, 'prawn')) {
             $ingredients['SEA-002'] = 0.120; // 120g Prawns
        }
        if (str_contains($slug, 'fish') || str_contains($slug, 'amok')) {
             $ingredients['SEA-001'] = 0.180; // 180g Fish
        }
        if (str_contains($slug, 'tofu') || str_contains($slug, 'vegetable') || str_contains($slug, 'vegan')) {
             $ingredients['PRT-006'] = 0.150; // 150g Tofu
             $ingredients['VEG-002'] = 0.050; // Lettuce/Greens
             $ingredients['VEG-005'] = 0.030; // Carrots
        }

        // --- FLAVORS / AROMATICS ---
        if (str_contains($slug, 'curry') || str_contains($slug, 'amok') || str_contains($slug, 'laksa')) {
             $ingredients['DRY-004'] = 0.150; // 150ml Coconut Milk
             $ingredients['DRY-005'] = 0.030; // 30g Curry Paste
             $ingredients['VEG-008'] = 0.010; // 10g Lemongrass
        }

        if (str_contains($slug, 'salad')) {
             $ingredients['VEG-002'] = 0.100; // Lettuce
             $ingredients['VEG-001'] = 0.050; // Tomato
             $ingredients['VEG-003'] = 0.020; // Onion
             $ingredients['DRY-001'] = 0.015; // Fish Sauce dressing
        }

        return ['ingredients' => $ingredients];
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Recipe;
use App\Models\MenuItem;
use App\Models\Ingredient;

class RecipeSeeder extends Seeder
{
    public function run(): void
    {
        $menuItems = MenuItem::all();
        $ingredients = Ingredient::all();
        
        $commonIngredients = [
            'Rice' => ['min' => 150, 'max' => 300, 'unit' => 'g'],
            'Salt' => ['min' => 2, 'max' => 5, 'unit' => 'g'],
            'Oil' => ['min' => 15, 'max' => 45, 'unit' => 'ml'],
            'Garlic' => ['min' => 5, 'max' => 15, 'unit' => 'g'],
            'Sugar' => ['min' => 5, 'max' => 15, 'unit' => 'g'],
            'Water' => ['min' => 100, 'max' => 500, 'unit' => 'ml'],
        ];

        $menuItems->each(function ($menuItem) use ($ingredients, $commonIngredients) {
            // Create main recipe
            $recipe = Recipe::create([
                'menu_item_id' => $menuItem->id,
                'yield_portions' => rand(1, 4),
                'instructions' => $this->generateInstructions(),
            ]);

            // Add 3-7 random ingredients plus common ingredients
            $recipeIngredients = [];
            $usedIngredientIds = [];
            $randomIngredients = $ingredients->random(rand(3, 7));
            
            foreach ($randomIngredients as $ingredient) {
                $recipeIngredients[] = [
                    'ingredient_id' => $ingredient->id,
                    'quantity' => rand(50, 500),
                    'unit' => is_string($ingredient->unit) ? $ingredient->unit : ($ingredient->unit->code ?? 'unit'),
                ];
                $usedIngredientIds[] = $ingredient->id;
            }

            // Add common ingredients (skip if already added)
            foreach ($commonIngredients as $name => $props) {
                $ingredient = $ingredients->where('name', $name)->first();
                if ($ingredient && !in_array($ingredient->id, $usedIngredientIds)) {
                    $recipeIngredients[] = [
                        'ingredient_id' => $ingredient->id,
                        'quantity' => rand($props['min'], $props['max']),
                        'unit' => $props['unit'],
                    ];
                }
            }

            // Create recipe ingredients
            foreach ($recipeIngredients as $ingredient) {
                $recipe->ingredients()->create($ingredient);
            }
        });
    }

    private function generateInstructions(): string
    {
        $steps = [
            "1. Prepare all ingredients",
            "2. Heat oil in a large pan/wok",
            "3. Cook main ingredients",
            "4. Add seasonings and spices",
            "5. Combine with remaining ingredients",
            "6. Simmer until done",
            "7. Check seasoning and adjust if needed",
            "8. Plate and garnish"
        ];

        return implode("\n", $steps);
    }

    private function generateNotes(): ?string
    {
        $notes = [
            "Best served immediately",
            "Can be prepared in advance",
            "Adjust spiciness to taste",
            "Store leftovers in refrigerator for up to 2 days",
            null, null // Add some null values for variety
        ];

        return $notes[array_rand($notes)];
    }


}
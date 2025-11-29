<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class RecipeController extends Controller
{
    /**
     * Display a listing of recipes
     */
    public function index(Request $request): JsonResponse
    {
        $query = Recipe::with(['menuItem', 'ingredients.ingredient']);

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('menuItem', function ($mq) use ($search) {
                      $mq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by menu item
        if ($request->has('menu_item_id') && $request->menu_item_id !== 'all') {
            $query->where('menu_item_id', $request->menu_item_id);
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->get('per_page', 15);
        $recipes = $query->paginate($perPage);

        return response()->json($recipes);
    }

    /**
     * Store a newly created recipe
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'menu_item_id' => 'nullable|exists:menu_items,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'instructions' => 'nullable|string',
            'prep_time_minutes' => 'nullable|integer|min:0',
            'cook_time_minutes' => 'nullable|integer|min:0',
            'servings' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
            'ingredients' => 'required|array|min:1',
            'ingredients.*.ingredient_id' => 'required|exists:ingredients,id',
            'ingredients.*.quantity' => 'required|numeric|min:0',
            'ingredients.*.notes' => 'nullable|string'
        ]);

        DB::beginTransaction();
        try {
            // Create recipe
            $recipe = Recipe::create([
                'menu_item_id' => $validated['menu_item_id'] ?? null,
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'instructions' => $validated['instructions'] ?? null,
                'prep_time_minutes' => $validated['prep_time_minutes'] ?? null,
                'cook_time_minutes' => $validated['cook_time_minutes'] ?? null,
                'servings' => $validated['servings'] ?? 1,
                'is_active' => $validated['is_active'] ?? true
            ]);

            // Create recipe ingredients
            foreach ($validated['ingredients'] as $ingredient) {
                RecipeIngredient::create([
                    'recipe_id' => $recipe->id,
                    'ingredient_id' => $ingredient['ingredient_id'],
                    'quantity' => $ingredient['quantity'],
                    'notes' => $ingredient['notes'] ?? null
                ]);
            }

            // Calculate cost
            $this->updateRecipeCost($recipe);

            $recipe->load(['menuItem', 'ingredients.ingredient']);

            DB::commit();

            return response()->json([
                'message' => 'Recipe created successfully',
                'data' => $recipe
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create recipe',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified recipe
     */
    public function show(Recipe $recipe): JsonResponse
    {
        $recipe->load(['menuItem', 'ingredients.ingredient.unit']);
        
        return response()->json([
            'data' => $recipe
        ]);
    }

    /**
     * Update the specified recipe
     */
    public function update(Request $request, Recipe $recipe): JsonResponse
    {
        $validated = $request->validate([
            'menu_item_id' => 'nullable|exists:menu_items,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'instructions' => 'nullable|string',
            'prep_time_minutes' => 'nullable|integer|min:0',
            'cook_time_minutes' => 'nullable|integer|min:0',
            'servings' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
            'ingredients' => 'sometimes|array|min:1',
            'ingredients.*.id' => 'nullable|exists:recipe_ingredients,id',
            'ingredients.*.ingredient_id' => 'required|exists:ingredients,id',
            'ingredients.*.quantity' => 'required|numeric|min:0',
            'ingredients.*.notes' => 'nullable|string'
        ]);

        DB::beginTransaction();
        try {
            // Update recipe
            $recipe->update([
                'menu_item_id' => $validated['menu_item_id'] ?? null,
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'instructions' => $validated['instructions'] ?? null,
                'prep_time_minutes' => $validated['prep_time_minutes'] ?? null,
                'cook_time_minutes' => $validated['cook_time_minutes'] ?? null,
                'servings' => $validated['servings'] ?? 1,
                'is_active' => $validated['is_active'] ?? $recipe->is_active
            ]);

            // Update ingredients if provided
            if (isset($validated['ingredients'])) {
                // Delete existing ingredients not in the update
                $ingredientIds = collect($validated['ingredients'])->pluck('id')->filter();
                $recipe->ingredients()->whereNotIn('id', $ingredientIds)->delete();

                // Update or create ingredients
                foreach ($validated['ingredients'] as $ingredient) {
                    if (isset($ingredient['id'])) {
                        RecipeIngredient::where('id', $ingredient['id'])->update([
                            'ingredient_id' => $ingredient['ingredient_id'],
                            'quantity' => $ingredient['quantity'],
                            'notes' => $ingredient['notes'] ?? null
                        ]);
                    } else {
                        RecipeIngredient::create([
                            'recipe_id' => $recipe->id,
                            'ingredient_id' => $ingredient['ingredient_id'],
                            'quantity' => $ingredient['quantity'],
                            'notes' => $ingredient['notes'] ?? null
                        ]);
                    }
                }

                // Recalculate cost
                $this->updateRecipeCost($recipe);
            }

            $recipe->load(['menuItem', 'ingredients.ingredient']);

            DB::commit();

            return response()->json([
                'message' => 'Recipe updated successfully',
                'data' => $recipe
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update recipe',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified recipe
     */
    public function destroy(Recipe $recipe): JsonResponse
    {
        // Check if recipe is linked to active menu items
        if ($recipe->menuItem && $recipe->menuItem->is_active) {
            return response()->json([
                'message' => 'Cannot delete recipe linked to active menu item. Deactivate it instead.'
            ], 422);
        }

        $recipe->ingredients()->delete();
        $recipe->delete();

        return response()->json([
            'message' => 'Recipe deleted successfully'
        ]);
    }

    /**
     * Duplicate a recipe
     */
    public function duplicate(Recipe $recipe): JsonResponse
    {
        DB::beginTransaction();
        try {
            $newRecipe = $recipe->replicate();
            $newRecipe->name = $recipe->name . ' (Copy)';
            $newRecipe->is_active = false;
            $newRecipe->save();

            // Copy ingredients
            foreach ($recipe->ingredients as $ingredient) {
                RecipeIngredient::create([
                    'recipe_id' => $newRecipe->id,
                    'ingredient_id' => $ingredient->ingredient_id,
                    'quantity' => $ingredient->quantity,
                    'notes' => $ingredient->notes
                ]);
            }

            $this->updateRecipeCost($newRecipe);
            $newRecipe->load(['ingredients.ingredient']);

            DB::commit();

            return response()->json([
                'message' => 'Recipe duplicated successfully',
                'data' => $newRecipe
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to duplicate recipe',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate and update recipe cost
     */
    private function updateRecipeCost(Recipe $recipe): void
    {
        $totalCost = $recipe->ingredients->sum(function ($recipeIngredient) {
            $ingredient = $recipeIngredient->ingredient;
            // Assuming ingredient has cost_per_unit
            return $recipeIngredient->quantity * ($ingredient->cost_per_unit ?? 0);
        });

        $recipe->update(['total_cost' => $totalCost]);
    }

    /**
     * Get recipe costing breakdown
     */
    public function costing(Recipe $recipe): JsonResponse
    {
        $recipe->load(['ingredients.ingredient.unit']);

        $breakdown = $recipe->ingredients->map(function ($recipeIngredient) {
            $ingredient = $recipeIngredient->ingredient;
            $cost = $recipeIngredient->quantity * ($ingredient->cost_per_unit ?? 0);

            return [
                'ingredient_id' => $ingredient->id,
                'ingredient_name' => $ingredient->name,
                'quantity' => $recipeIngredient->quantity,
                'unit' => $ingredient->unit,
                'cost_per_unit' => $ingredient->cost_per_unit ?? 0,
                'total_cost' => $cost,
                'percentage' => $recipe->total_cost > 0 ? ($cost / $recipe->total_cost) * 100 : 0
            ];
        });

        return response()->json([
            'recipe_id' => $recipe->id,
            'recipe_name' => $recipe->name,
            'total_cost' => $recipe->total_cost,
            'servings' => $recipe->servings,
            'cost_per_serving' => $recipe->servings > 0 ? $recipe->total_cost / $recipe->servings : 0,
            'breakdown' => $breakdown
        ]);
    }

    /**
     * Get recipe statistics
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total' => Recipe::count(),
            'active' => Recipe::where('is_active', true)->count(),
            'inactive' => Recipe::where('is_active', false)->count(),
            'with_menu_items' => Recipe::whereNotNull('menu_item_id')->count(),
            'without_menu_items' => Recipe::whereNull('menu_item_id')->count(),
            'avg_ingredients' => round(RecipeIngredient::groupBy('recipe_id')
                ->selectRaw('AVG(ingredient_count) as avg')
                ->from(DB::raw('(SELECT recipe_id, COUNT(*) as ingredient_count FROM recipe_ingredients GROUP BY recipe_id) as counts'))
                ->value('avg') ?? 0, 1),
            'total_cost_average' => Recipe::where('is_active', true)->avg('total_cost') ?? 0
        ];

        return response()->json($stats);
    }
}

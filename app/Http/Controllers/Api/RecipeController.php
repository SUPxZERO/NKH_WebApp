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
    public function index(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $query = Recipe::with(['menuItem.translations', 'ingredients.ingredient.unit']);

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('menuItem.translations', function ($mq) use ($search) {
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

        return \App\Http\Resources\RecipeResource::collection($recipes);
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
                'data' => new \App\Http\Resources\RecipeResource($recipe)
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
        $recipe->load(['menuItem.translations', 'ingredients.ingredient.unit']);
        
        return response()->json([
            'data' => new \App\Http\Resources\RecipeResource($recipe)
        ]);
    }

    /**
     * Update the specified recipe
     */
    public function update(Request $request, Recipe $recipe): JsonResponse
    {
        $validated = $request->validate([
            'menu_item_id' => 'nullable|exists:menu_items,id',
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'instructions' => 'nullable|string',
            'prep_time_minutes' => 'nullable|integer|min:0',
            'cook_time_minutes' => 'nullable|integer|min:0',
            'servings' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
            'ingredients' => 'sometimes|array|min:1',
            'ingredients.*.id' => 'nullable|exists:recipe_ingredients,id',
            'ingredients.*.ingredient_id' => 'required_with:ingredients|exists:ingredients,id',
            'ingredients.*.quantity' => 'required_with:ingredients|numeric|min:0',
            'ingredients.*.notes' => 'nullable|string'
        ]);

        DB::beginTransaction();
        try {
            // Build update data dynamically - only include fields that were provided
            $updateData = [];
            if (array_key_exists('menu_item_id', $validated)) $updateData['menu_item_id'] = $validated['menu_item_id'];
            if (array_key_exists('name', $validated)) $updateData['name'] = $validated['name'];
            if (array_key_exists('description', $validated)) $updateData['description'] = $validated['description'];
            if (array_key_exists('instructions', $validated)) $updateData['instructions'] = $validated['instructions'];
            if (array_key_exists('prep_time_minutes', $validated)) $updateData['prep_time_minutes'] = $validated['prep_time_minutes'];
            if (array_key_exists('cook_time_minutes', $validated)) $updateData['cook_time_minutes'] = $validated['cook_time_minutes'];
            if (array_key_exists('servings', $validated)) $updateData['servings'] = $validated['servings'] ?? 1;
            if (array_key_exists('is_active', $validated)) $updateData['is_active'] = $validated['is_active'];
            
            if (!empty($updateData)) {
                $recipe->update($updateData);
            }

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

            $recipe->load(['menuItem.translations', 'ingredients.ingredient.unit']);

            DB::commit();

            return response()->json([
                'message' => 'Recipe updated successfully',
                'data' => new \App\Http\Resources\RecipeResource($recipe)
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
            // Set menu_item_id to null since it has a unique constraint
            $newRecipe->menu_item_id = null;
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
                'data' => new \App\Http\Resources\RecipeResource($newRecipe)
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
        $recipeTotalCost = (float) ($recipe->total_cost ?? 0);

        $breakdown = $recipe->ingredients->map(function ($recipeIngredient) use ($recipeTotalCost) {
            $ingredient = $recipeIngredient->ingredient;
            
            // Handle case where ingredient may have been deleted
            if (!$ingredient) {
                return [
                    'ingredient_id' => $recipeIngredient->ingredient_id,
                    'ingredient_name' => 'Unknown Ingredient',
                    'quantity' => (float) $recipeIngredient->quantity,
                    'unit' => $recipeIngredient->unit ?? '-',
                    'cost_per_unit' => 0,
                    'total_cost' => 0,
                    'percentage' => 0
                ];
            }
            
            $costPerUnit = (float) ($ingredient->cost_per_unit ?? 0);
            $cost = (float) $recipeIngredient->quantity * $costPerUnit;

            // Get unit name properly (unit is a relationship to Unit model)
            $unitName = '-';
            if ($ingredient->unit) {
                $unitName = $ingredient->unit->name ?? $ingredient->unit->code ?? '-';
            }

            return [
                'ingredient_id' => $ingredient->id,
                'ingredient_name' => $ingredient->name,
                'quantity' => (float) $recipeIngredient->quantity,
                'unit' => $unitName,
                'cost_per_unit' => $costPerUnit,
                'total_cost' => $cost,
                'percentage' => $recipeTotalCost > 0 ? ($cost / $recipeTotalCost) * 100 : 0
            ];
        });

        $servings = (int) ($recipe->servings ?? 1);
        $totalCost = (float) ($recipe->total_cost ?? 0);

        return response()->json([
            'recipe_id' => $recipe->id,
            'recipe_name' => $recipe->name,
            'total_cost' => $totalCost,
            'servings' => $servings,
            'cost_per_serving' => $servings > 0 ? $totalCost / $servings : 0,
            'breakdown' => $breakdown
        ]);
    }

    /**
     * Get recipe statistics
     */
    public function stats(): JsonResponse
    {
        // Calculate avg_ingredients safely
        $avgIngredients = 0;
        $recipeCount = Recipe::count();
        if ($recipeCount > 0) {
            $totalIngredients = RecipeIngredient::count();
            $avgIngredients = round($totalIngredients / $recipeCount, 1);
        }

        $stats = [
            'total' => $recipeCount,
            'active' => Recipe::where('is_active', true)->count(),
            'inactive' => Recipe::where('is_active', false)->count(),
            'with_menu_items' => Recipe::whereNotNull('menu_item_id')->count(),
            'without_menu_items' => Recipe::whereNull('menu_item_id')->count(),
            'avg_ingredients' => $avgIngredients,
            'avg_cost' => (float) (Recipe::where('is_active', true)->avg('total_cost') ?? 0)
        ];

        return response()->json($stats);
    }
}

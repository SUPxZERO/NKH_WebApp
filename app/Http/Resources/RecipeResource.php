<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecipeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'menu_item_id' => $this->menu_item_id,
            'name' => $this->name,
            'description' => $this->description,
            'instructions' => $this->instructions,
            'prep_time_minutes' => $this->prep_time_minutes,
            'cook_time_minutes' => $this->cook_time_minutes,
            'servings' => (int) $this->servings,
            'yield_portions' => $this->yield_portions,
            'is_active' => (bool) $this->is_active,
            'total_cost' => (float) $this->total_cost,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'menu_item' => $this->whenLoaded('menuItem', function () {
                // Use MenuItemResource if available, or manually transform to ensure name is present
                return new MenuItemResource($this->menuItem);
            }),
            'ingredients' => $this->whenLoaded('ingredients', function () {
                return $this->ingredients->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'recipe_id' => $item->recipe_id,
                        'ingredient_id' => $item->ingredient_id,
                        'quantity' => (float) $item->quantity,
                        'unit' => $item->unit,
                        'notes' => $item->notes,
                        'ingredient' => $item->ingredient ? [
                            'id' => $item->ingredient->id,
                            'name' => $item->ingredient->name,
                            'code' => $item->ingredient->code,
                            'cost_per_unit' => (float) $item->ingredient->cost_per_unit,
                            'unit' => $item->ingredient->unit,
                        ] : null,
                    ];
                });
            }),
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $translations = $this->translations;
        $currentLocale = app()->getLocale();
        
        // Get translation for current locale
        $translation = $translations->where('locale', $currentLocale)->first();
        
        // If no translation in current locale, get the first available translation
        if (!$translation && $translations->isNotEmpty()) {
            $translation = $translations->first();
        }

        $menuItems = $this->whenLoaded('menuItems', function() {
            return $this->menuItems;
        }, collect());

        return [
            'id' => $this->id,
            'location_id' => $this->location_id,
            'name' => $translation ? $translation->name : null,
            'slug' => $this->slug,
            'description' => $translation ? $translation->description : null,
            'display_order' => (int) $this->display_order,
            'is_active' => (bool) $this->is_active,
            'parent_id' => $this->parent_id,
            'children' => CategoryResource::collection($this->whenLoaded('children')),
            'menu_items' => MenuItemResource::collection($menuItems),
            'menu_items_count' => $this->whenLoaded('menuItems', function() {
                return $this->menu_items_count ?? $this->menuItems->count();
            }, 0),
            'children_count' => $this->whenLoaded('children', function() {
                return $this->children->count();
            }, 0),
            'total_items' => $this->when($this->relationLoaded('children'), function() {
                return $this->menu_items_count + 
                    $this->children->sum(function($child) {
                        return $child->menu_items_count ?? 0;
                    });
            }, 0),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

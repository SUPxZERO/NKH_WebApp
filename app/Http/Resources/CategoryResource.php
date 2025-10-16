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

        return [
            'id' => $this->id,
            'location_id' => $this->location_id,
            'name' => $translation ? $translation->name : null,
            'slug' => $this->slug,
            'description' => $translation ? $translation->description : null,
            'display_order' => $this->display_order,
            'is_active' => (bool) $this->is_active,
            'parent_id' => $this->parent_id,
            'children' => $this->whenLoaded('children', function() {
                return CategoryResource::collection($this->children);
            }),
            'menu_items' => $this->whenLoaded('menuItems', function() {
                return new MenuItemCollection($this->menuItems->where('is_active', true));
            }),
            'menu_items_count' => $this->menu_items_count ?? 0,
            'total_items' => $this->when($this->relationLoaded('children'), function() {
                $directItems = $this->menu_items_count ?? 0;
                $childrenItems = $this->children->sum('menu_items_count');
                return $directItems + $childrenItems;
            }, 0),
            'translations' => $translations,
            '_debug' => [
                'has_translations' => $translations->isNotEmpty(),
                'translations_count' => $translations->count(),
                'available_locales' => $translations->pluck('locale')->toArray(),
                'current_locale' => $currentLocale,
            ],
        ];
    }
}

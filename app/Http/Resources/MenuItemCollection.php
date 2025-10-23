<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

class MenuItemCollection extends ResourceCollection
{
    public function toArray($request)
    {
        $currentLocale = app()->getLocale();
        
        return [
            'data' => $this->collection->map(function ($menuItem) use ($currentLocale) {
                $translation = $menuItem->translations->where('locale', $currentLocale)->first()
                    ?? $menuItem->translations->first();

                return [
                    'id' => $menuItem->id,
                    'location_id' => $menuItem->location_id,
                    'category_id' => $menuItem->category_id,
                    'name' => $translation ? $translation->name : null,
                    'description' => $translation ? $translation->description : null,
                    'sku' => $menuItem->sku,
                    'slug' => $menuItem->slug,
                    'price' => (float) $menuItem->price,
                    'cost' => (float) $menuItem->cost,
                    'image_path' => $menuItem->image_path,
                    'is_popular' => (bool) $menuItem->is_popular,
                    'is_active' => (bool) $menuItem->is_active,
                    'display_order' => $menuItem->display_order,
                    'category' => [
                        'id' => $menuItem->category->id,
                        'name' => $menuItem->category->translations->where('locale', $currentLocale)->first()?->name
                            ?? $menuItem->category->translations->first()?->name,
                    ],
                    'translations' => $menuItem->translations->map(function ($translation) {
                        return [
                            'id' => $translation->id,
                            'locale' => $translation->locale,
                            'name' => $translation->name,
                            'description' => $translation->description,
                        ];
                    }),
                    'created_at' => $menuItem->created_at,
                    'updated_at' => $menuItem->updated_at,
                ];
            }),
            'meta' => [
                'total' => $this->collection->count(),
            ],
        ];
    }
}
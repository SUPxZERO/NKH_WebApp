<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class MenuItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Handle image URL
        $imageUrl = null;
        if ($this->image_path) {
            if (str_starts_with($this->image_path, 'http')) {
                $imageUrl = $this->image_path;
            } else {
                $imageUrl = asset('storage/' . $this->image_path);
            }
        }

        // Get current translation
        $translation = $this->translations->firstWhere('locale', app()->getLocale()) 
            ?? $this->translations->first();

        return [
            'id' => $this->id,
            'location_id' => $this->location_id,
            'category_id' => $this->category_id,
            'name' => $translation ? $translation->name : ($this->name ?? ucwords(str_replace('-', ' ', $this->slug))),
            'sku' => $this->sku,
            'slug' => $this->slug,
            'description' => $translation ? $translation->description : null,
            'price' => (float) $this->price,
            'cost' => (float) $this->cost,
            'image_path' => $this->image_path,
            'image_url' => $imageUrl,
            'is_popular' => (bool) $this->is_popular,
            'is_active' => (bool) $this->is_active,
            'display_order' => (int) $this->display_order,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];

    }
}

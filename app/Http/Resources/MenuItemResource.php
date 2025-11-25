<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class MenuItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Handle image URL - check if it's in public/images directly
        $imageUrl = null;
        if ($this->image_path) {
            if (str_starts_with($this->image_path, 'http')) {
                $imageUrl = $this->image_path;
            } elseif (str_starts_with($this->image_path, 'images/')) {
                // Direct public path
                $imageUrl = asset($this->image_path);
            } else {
                // Storage path
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
            'description' => $translation ? $translation->description : $this->description,
            'price' => (float) $this->price,
            'cost' => $this->when($this->cost !== null, (float) $this->cost),
            'original_price' => $this->when(isset($this->original_price), (float) $this->original_price),
            'image_path' => $this->image_path,
            'image_url' => $imageUrl,
            'is_popular' => (bool) $this->is_popular,
            'is_featured' => (bool) ($this->is_featured ?? false),
            'featured_order' => (int) ($this->featured_order ?? 0),
            'badge' => $this->badge,
            'is_active' => (bool) $this->is_active,
            'display_order' => (int) $this->display_order,
            'rating' => $this->rating ? (float) $this->rating : null,
            'reviews_count' => (int) ($this->reviews_count ?? 0),
            'prep_time' => $this->prep_time ? (int) $this->prep_time : null,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];

    }
}

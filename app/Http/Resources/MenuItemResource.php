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
        $imagePath = $this->image_path;
        if ($imagePath) {
            // Normalize slashes
            $imagePath = str_replace('\\', '/', $imagePath);
            
            // If it's not a full URL and doesn't start with /, add /storage or /
            if (!str_starts_with($imagePath, 'http')) {
                if (str_starts_with($imagePath, 'images/')) {
                    $imagePath = '/' . $imagePath;
                } elseif (!str_starts_with($imagePath, '/')) {
                    $imagePath = '/storage/' . $imagePath;
                }
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
            'image_path' => $imagePath,
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

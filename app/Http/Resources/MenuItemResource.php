<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class MenuItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Handle image URL - check if it's a local path or full URL
        $imageUrl = null;
        if ($this->image_path) {
            if (str_starts_with($this->image_path, 'http')) {
                $imageUrl = $this->image_path;
            } else {
                $imageUrl = $this->image_path; // Use local path directly
            }
        }

        $name = optional($this->translations->firstWhere('locale', app()->getLocale()))->name
            ?? optional($this->translations->first())->name
            ?? ucwords(str_replace('-', ' ', $this->slug));
        $description = optional($this->translations->firstWhere('locale', app()->getLocale()))->description
            ?? optional($this->translations->first())->description;

        return [
            'id' => $this->id,
            'location_id' => $this->location_id,
            'category_id' => $this->category_id,
            'sku' => $this->sku,
            'slug' => $this->slug,
            'name' => $name,
            'description' => $description,
            'price' => (float) $this->price, // Ensure it's a float
            'cost' => $this->cost ? (float) $this->cost : null,
            'original_price' => null, // Can be added later for discounts
            'image_path' => $this->image_path,
            'image_url' => $imageUrl,
            'is_popular' => (bool) $this->is_popular,
            'is_active' => (bool) $this->is_active,
            'display_order' => $this->display_order,
            'rating' => null, // Can be calculated from reviews later
            'prep_time' => rand(5, 25), // Random prep time for now
            'ingredients' => [], // Can be added later
            'dietary_restrictions' => [], // Can be added later
            'nutrition' => null, // Can be added later
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'category' => $this->whenLoaded('category'),
            'location' => $this->whenLoaded('location'),
        ];
    }
}

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
            $originalPath = str_replace('\\', '/', $imagePath);
            $cleanPath = ltrim($originalPath, '/');
            
            // 1. Check if it's already a full URL
            if (str_starts_with($cleanPath, 'http')) {
                // Keep as is
            }
            // 2. Check if it's in public/images/menu-items (Legacy/Seeded data)
            // DB often has 'menu_images/filename.jpg', but files are in 'public/images/menu-items/filename.jpg'
            else {
                $filename = basename($cleanPath);
                $publicMenuPath = 'images/menu-items/' . $filename;
                
                if (file_exists(public_path($publicMenuPath))) {
                    $imagePath = url($publicMenuPath);
                } 
                // 3. Fallback to Storage (New uploads)
                else {
                    // Cleanup 'storage/' from path if present to avoid duplication
                    $storageRelPath = str_replace('storage/', '', $cleanPath);
                    
                    // Check if exists in storage
                    if (Storage::disk('public')->exists($storageRelPath)) {
                        $imagePath = url("storage/{$storageRelPath}");
                    } else {
                        // If file not found in either location, return null or keep original (frontend often handles null)
                        $imagePath = null;
                    }
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

            // Time information
            'prep_time' => $this->prep_time ? (int) $this->prep_time : null,
            'cook_time' => $this->cook_time ? (int) $this->cook_time : null,
            'total_time' => $this->total_time,

            // Nutrition & ingredients
            'calories' => $this->calories ? (int) $this->calories : null,
            'nutrition' => $this->nutrition,
            'ingredients' => $this->ingredients ?? [],
            'allergens' => $this->allergens ?? [],
            'dietary_tags' => $this->dietary_tags ?? [],

            // Additional info
            'serving_size' => $this->serving_size,
            'spice_level' => (int) ($this->spice_level ?? 0),

            // Availability
            'availability_status' => $this->availability_status ?? 'available',
            'availability_note' => $this->availability_note,
            'is_available' => $this->isAvailable(),

            // Relations
            'category' => new CategoryResource($this->whenLoaded('category')),
            'recipe' => $this->when($this->relationLoaded('recipe') && $this->recipe, function () {
                return [
                    'id' => $this->recipe->id,
                    'instructions' => $this->recipe->instructions,
                    'prep_time_minutes' => $this->recipe->prep_time_minutes,
                    'cook_time_minutes' => $this->recipe->cook_time_minutes,
                    'servings' => $this->recipe->servings,
                ];
            }),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

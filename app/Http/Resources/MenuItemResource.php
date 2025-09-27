<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class MenuItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $imageUrl = $this->image_path ? Storage::disk('public')->url($this->image_path) : null;
        $name = optional($this->translations->firstWhere('locale', app()->getLocale()))->name
            ?? optional($this->translations->first())->name
            ?? $this->slug;
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
            'price' => $this->price,
            'cost' => $this->cost,
            'image_url' => $imageUrl,
            'is_popular' => (bool) $this->is_popular,
            'is_active' => (bool) $this->is_active,
            'display_order' => $this->display_order,
        ];
    }
}

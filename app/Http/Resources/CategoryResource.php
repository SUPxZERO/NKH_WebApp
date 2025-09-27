<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'location_id' => $this->location_id,
            'slug' => $this->slug,
            'display_order' => $this->display_order,
            'is_active' => (bool) $this->is_active,
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PromotionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'location_id' => $this->location_id,
            'code' => $this->code,
            'name' => $this->name,
            'description' => $this->description,
            'type' => $this->type,
            // UI expects discount_value instead of value
            'discount_value' => $this->value,
            'min_order_amount' => $this->min_order_amount,
            'max_discount_amount' => $this->max_discount_amount,
            'usage_limit' => $this->usage_limit,
            'is_active' => (bool) $this->is_active,
            // UI expects start_date/end_date instead of *_at
            'start_date' => optional($this->start_at)->toISOString(),
            'end_date' => optional($this->end_at)->toISOString(),
            'applicable_to' => $this->applicable_to ?? null,
            'terms_conditions' => $this->terms_conditions ?? null,
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}

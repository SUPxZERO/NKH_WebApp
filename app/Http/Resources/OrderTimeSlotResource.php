<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderTimeSlotResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'location_id' => $this->location_id,
            'slot_date' => $this->slot_date->toDateString(),
            'slot_start_time' => $this->slot_start_time,
            'slot_type' => $this->slot_type,
            'max_orders' => $this->max_orders,
            'current_orders' => $this->current_orders,
        ];
    }
}

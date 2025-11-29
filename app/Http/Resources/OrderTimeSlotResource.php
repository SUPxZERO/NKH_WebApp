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
            'label' => $this->slot_date->format('M j, Y') . ' at ' . $this->slot_start_time,
            'start' => $this->slot_date->format('Y-m-d') . 'T' . $this->slot_start_time,
            'end' => $this->slot_date->format('Y-m-d') . 'T' . $this->slot_start_time, // You can calculate end time if needed
            'available' => $this->current_orders < $this->max_orders,
            // Additional data for backend compatibility
            'location_id' => $this->location_id,
            'slot_date' => $this->slot_date->toDateString(),
            'slot_start_time' => $this->slot_start_time,
            'slot_type' => $this->slot_type,
            'max_orders' => $this->max_orders,
            'current_orders' => $this->current_orders,
        ];
    }
}

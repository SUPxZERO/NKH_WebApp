<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LocationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'address_line1' => $this->address_line1,
            'address_line2' => $this->address_line2,
            'city' => $this->city,
            'state' => $this->state,
            'postal_code' => $this->postal_code,
            'country' => $this->country,
            'phone' => $this->phone,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'is_active' => (bool) $this->is_active,
            'accepts_online_orders' => (bool) $this->accepts_online_orders,
            'accepts_pickup' => (bool) $this->accepts_pickup,
            'accepts_delivery' => (bool) $this->accepts_delivery,
            'operating_hours' => $this->operatingHours,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

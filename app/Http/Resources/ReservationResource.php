<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReservationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $reservedAt = null;
        if ($this->reservation_date && $this->reservation_time) {
            $reservedAt = $this->reservation_date.'T'.$this->reservation_time;
        }

        return [
            'id' => $this->id,
            'location_id' => $this->location_id,
            'table_id' => $this->table_id,
            'customer_id' => $this->customer_id,
            'code' => $this->code,
            'reservation_number' => $this->reservation_number,
            // Map DB (date + time) to UI expected datetime string
            'reserved_for' => $reservedAt,
            // UI expects duration_minutes/guest_count
            'duration_minutes' => $this->duration_minutes ?? 60,
            'guest_count' => $this->party_size ?? $this->guest_count ?? 0,
            'status' => $this->status,
            'notes' => $this->notes ?? $this->special_requests,
            'table' => new DiningTableResource($this->whenLoaded('table')),
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}

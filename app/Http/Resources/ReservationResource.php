<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;

class ReservationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Use Carbon to properly format datetime as ISO 8601 string
        $reservedAt = null;
        if ($this->reservation_date && $this->reservation_time) {
            try {
                $dateStr = $this->reservation_date instanceof \Carbon\Carbon 
                    ? $this->reservation_date->format('Y-m-d') 
                    : substr((string)$this->reservation_date, 0, 10);
                    
                $reservedAt = Carbon::parse($dateStr . ' ' . $this->reservation_time)->toIso8601String();
            } catch (\Exception $e) {
                // Fallback to original concatenation if parsing fails
                $reservedAt = null;
            }
        }

        $canCancel = false;
        try {
            if ($this->reservation_date && in_array($this->status, ['pending', 'confirmed'], true)) {
                $today = Carbon::today()->toDateString();

                $reservationDate = $this->reservation_date instanceof \Carbon\Carbon
                    ? $this->reservation_date->format('Y-m-d')
                    : substr((string) $this->reservation_date, 0, 10);

                $canCancel = $reservationDate > $today;
            }
        } catch (\Throwable $e) {
            $canCancel = false;
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
            'can_cancel' => $canCancel,
            'table' => new DiningTableResource($this->whenLoaded('table')),
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}

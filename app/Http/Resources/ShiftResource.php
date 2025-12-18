<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShiftResource extends JsonResource
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
            'employee_id' => $this->employee_id,
            'location_id' => $this->location_id,
            'position_id' => $this->position_id,
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'shift_type' => $this->shift_type,
            'status' => $this->status,
            'notes' => $this->notes,
            'date' => $this->date ? $this->date->format('Y-m-d') : null,
            
            // Nested relations
            'employee' => new EmployeeResource($this->whenLoaded('employee')),
            'location' => $this->whenLoaded('location', function() {
                return [
                    'id' => $this->location->id,
                    'name' => $this->location->name,
                ];
            }),
            'position' => $this->whenLoaded('position', function() {
                return [
                    'id' => $this->position->id,
                    'title' => $this->position->title,
                ];
            }),
        ];
    }
}

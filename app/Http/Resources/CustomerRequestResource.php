<?php

namespace App\Http\Resources;

class CustomerRequestResource extends BaseResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'type' => $this->type,
            'subject' => $this->subject,
            'description' => $this->description,
            'status' => $this->status,
            'priority' => $this->priority,
            'admin_notes' => $this->admin_notes,
            'resolution' => $this->resolution,
            'resolved_at' => $this->transformDate($this->resolved_at),
            'created_at' => $this->transformDate($this->created_at),
            'updated_at' => $this->transformDate($this->updated_at),
        ];
    }
}
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user' => new UserResource($this->whenLoaded('user')),
            'preferred_location_id' => $this->preferred_location_id,
            'birth_date' => optional($this->birth_date)->toDateString(),
            'gender' => $this->gender,
            'preferences' => $this->preferences,
            'points_balance' => $this->points_balance,
            'notes' => $this->notes,
        ];
    }
}

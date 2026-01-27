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
            'customer_code' => $this->customer_code,
            'preferred_location_id' => $this->preferred_location_id,
            'preferred_location' => $this->whenLoaded('preferredLocation', function () {
                return [
                    'id' => $this->preferredLocation->id,
                    'name' => $this->preferredLocation->name,
                ];
            }),
            'birth_date' => optional($this->birth_date)->toDateString(),
            'gender' => $this->gender,
            'preferred_language' => $this->preferred_language ?? 'en',
            'marketing_consent' => (bool) $this->marketing_consent,
            'preferences' => $this->preferences,
            'points_balance' => $this->points_balance,
            'loyalty_points' => $this->loyalty_points,
            'total_spent' => $this->total_spent,
            'customer_tier' => $this->customer_tier,
            'notes' => $this->notes,
        ];
    }
}

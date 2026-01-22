<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoyaltyPointResource extends JsonResource
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
            'points' => $this->points,
            'type' => $this->type, // earn_purchase, redeem_reward, bonus, etc.
            'description' => $this->description,
            'reference_id' => $this->reference_id,
            'occurred_at' => $this->occurred_at instanceof \Carbon\Carbon
                ? $this->occurred_at->toISOString()
                : $this->occurred_at,
        ];
    }
}

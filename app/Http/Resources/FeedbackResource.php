<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FeedbackResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer_name' => $this->customer?->user?->name ?? 'Anonymous Customer',
            'customer_role' => 'Verified Customer',
            'content' => $this->comments ?? '',
            'rating' => (int) ($this->rating ?? 5),
            'avatar' => $this->getAvatar(),
            'created_at' => $this->created_at,
            'formatted_date' => $this->created_at?->format('F d, Y'),
        ];
    }

    private function getAvatar(): string
    {
        // Generate random avatar emoji based on customer name
        $avatars = ['👨', '👩', '👨‍💼', '👩‍💼', '👨‍🦱', '👩‍🦱', '👨‍🦰', '👩‍🦰'];
        $index = abs(crc32($this->customer?->user?->name ?? 'default')) % count($avatars);
        return $avatars[$index];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DiningTableResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'floor_id' => $this->floor_id,
            'code' => $this->code,
            'capacity' => $this->capacity,
            'status' => $this->status,
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'location_id' => $this->location_id,
            'expense_category_id' => $this->expense_category_id,
            'expense_date' => is_string($this->expense_date) ? $this->expense_date : optional($this->expense_date)->toDateString(),
            'amount' => (float) $this->amount,
            'currency' => $this->currency,
            'vendor_name' => $this->vendor_name,
            'reference' => $this->reference,
            'description' => $this->description,
            'status' => $this->status,
            // Aliased relation required by UI
            'expense_category' => new ExpenseCategoryResource($this->whenLoaded('category')),
            'location' => new LocationResource($this->whenLoaded('location')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}

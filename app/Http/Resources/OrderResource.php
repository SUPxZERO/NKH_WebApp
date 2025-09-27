<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'location_id' => $this->location_id,
            'table_id' => $this->table_id,
            'customer_id' => $this->customer_id,
            'employee_id' => $this->employee_id,
            'order_number' => $this->order_number,
            'type' => $this->type,
            'order_type' => $this->order_type,
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'subtotal' => $this->subtotal,
            'tax_total' => $this->tax_total,
            'discount_total' => $this->discount_total,
            'service_charge' => $this->service_charge,
            'total' => $this->total,
            'currency' => $this->currency,
            'placed_at' => optional($this->placed_at)->toISOString(),
            'scheduled_at' => optional($this->scheduled_at)->toISOString(),
            'closed_at' => optional($this->closed_at)->toISOString(),
            'notes' => $this->notes,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'invoice' => new InvoiceResource($this->whenLoaded('invoice')),
        ];
    }
}

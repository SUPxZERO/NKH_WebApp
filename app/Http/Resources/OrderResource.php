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
            'order_type' => $this->order_type,
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'subtotal' => $this->subtotal,
            'tax_amount' => $this->tax_amount,
            'discount_amount' => $this->discount_amount,
            'service_charge' => $this->service_charge,
            'delivery_fee' => $this->when(isset($this->delivery_fee), $this->delivery_fee),
            'total_amount' => $this->total_amount,
            // Backward-compat aliases expected by some UI code
            'tax_total' => $this->tax_amount,
            'discount_total' => $this->discount_amount,
            // UI alias for backwards compatibility
            'total' => $this->total_amount,
            'currency' => $this->currency,
            'ordered_at' => optional($this->ordered_at)->toISOString(),
            'scheduled_at' => optional($this->scheduled_at)->toISOString(),
            'completed_at' => optional($this->completed_at)->toISOString(),
            // UI uses created_at in displays
            'created_at' => optional($this->created_at)->toISOString(),
            'special_instructions' => $this->special_instructions,
            'table' => new DiningTableResource($this->whenLoaded('table')),
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'invoice' => new InvoiceResource($this->whenLoaded('invoice')),
        ];
    }
}

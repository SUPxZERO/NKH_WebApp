<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'location_id' => $this->location_id,
            'invoice_number' => $this->invoice_number,
            'subtotal' => $this->subtotal,
            'tax_total' => $this->tax_amount,
            'discount_total' => $this->discount_amount,
            'service_charge' => $this->service_charge,
            'total' => $this->total_amount,
            'amount_paid' => $this->amount_paid,
            'amount_due' => $this->amount_due,
            'currency' => $this->currency,
            'issued_at' => optional($this->issued_at)->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Payment status
            'status' => $this->amount_due <= 0 ? 'paid' : 'unpaid',
            
            // Location (for display in UI)
            'location' => $this->whenLoaded('location', function () {
                return [
                    'id' => $this->location->id,
                    'name' => $this->location->name,
                ];
            }),

            // Related order information
            'order' => $this->whenLoaded('order', function () {
                return [
                    'id' => $this->order->id,
                    'order_number' => $this->order->order_number,
                    'type' => $this->order->order_type,
                    'status' => $this->order->status,
                    // Backward-compat alias for older UI
                    'placed_at' => $this->order->ordered_at?->toISOString(),
                    'ordered_at' => $this->order->ordered_at?->toISOString(),
                    'customer' => $this->order->relationLoaded('customer') ? [
                        'id' => $this->order->customer->id,
                        'user' => $this->order->customer->relationLoaded('user') ? [
                            'id' => $this->order->customer->user->id,
                            'name' => $this->order->customer->user->name,
                            'email' => $this->order->customer->user->email,
                        ] : null,
                    ] : null,
                    'items' => OrderItemResource::collection($this->whenLoaded('order.items')),
                ];
            }),
            
            // Payment history
            'payments' => $this->whenLoaded('payments', function () {
                return $this->payments->map(function ($payment) {
                    return [
                        'id' => $payment->id,
                        'amount' => $payment->amount,
                        'currency' => $this->currency,
                        'status' => $payment->status,
                        'paid_at' => optional($payment->processed_at)?->toISOString(),
                        'reference' => $payment->reference_number,
                    ];
                });
            }),
        ];
    }
}

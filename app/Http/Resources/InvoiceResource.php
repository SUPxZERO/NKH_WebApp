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
            'tax_total' => $this->tax_total,
            'discount_total' => $this->discount_total,
            'service_charge' => $this->service_charge,
            'total' => $this->total,
            'amount_paid' => $this->amount_paid,
            'amount_due' => $this->amount_due,
            'currency' => $this->currency,
            'issued_at' => optional($this->issued_at)->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Payment status
            'status' => $this->amount_due <= 0 ? 'paid' : 'unpaid',
            
            // Related order information
            'order' => $this->whenLoaded('order', function () {
                return [
                    'id' => $this->order->id,
                    'order_number' => $this->order->order_number,
                    'type' => $this->order->type,
                    'status' => $this->order->status,
                    'placed_at' => $this->order->placed_at?->toISOString(),
                    'items' => OrderItemResource::collection($this->whenLoaded('order.items')),
                ];
            }),
            
            // Payment history
            'payments' => $this->whenLoaded('payments', function () {
                return $this->payments->map(function ($payment) {
                    return [
                        'id' => $payment->id,
                        'amount' => $payment->amount,
                        'currency' => $payment->currency,
                        'status' => $payment->status,
                        'paid_at' => $payment->paid_at?->toISOString(),
                        'reference' => $payment->reference,
                    ];
                });
            }),
        ];
    }
}

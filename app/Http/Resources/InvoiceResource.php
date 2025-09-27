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
        ];
    }
}

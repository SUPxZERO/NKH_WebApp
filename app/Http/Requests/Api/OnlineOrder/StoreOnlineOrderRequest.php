<?php

namespace App\Http\Requests\Api\OnlineOrder;

use Illuminate\Foundation\Http\FormRequest;

class StoreOnlineOrderRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'order_type' => ['required','in:pickup,delivery'],
            'location_id' => ['required','exists:locations,id'],
            'customer_address_id' => ['nullable','required_if:order_type,delivery','exists:customer_addresses,id'],
            'time_slot_id' => ['required','exists:order_time_slots,id'],
            'notes' => ['nullable','string'],
            'order_items' => ['required','array','min:1'],
            'order_items.*.menu_item_id' => ['required','exists:menu_items,id'],
            'order_items.*.quantity' => ['required','integer','min:1'],
        ];
    }
}

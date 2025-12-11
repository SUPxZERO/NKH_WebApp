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
            // Accept either time_slot_id OR slot_date + slot_time
            'time_slot_id' => ['nullable','exists:order_time_slots,id'],
            'slot_date' => ['required_without:time_slot_id','date','after_or_equal:today'],
            'slot_time' => ['required_without:time_slot_id','date_format:H:i,H:i:s'], // Accept both formats
            'notes' => ['nullable','string'],
            'promotion_code' => ['nullable','string'],
            'payment_mode' => ['nullable', 'string', 'in:pay_now,pay_on_delivery,pay_on_pickup'],
            'order_items' => ['required','array','min:1'],
            'order_items.*.menu_item_id' => ['required','exists:menu_items,id'],
            'order_items.*.quantity' => ['required','integer','min:1'],
        ];
    }
}

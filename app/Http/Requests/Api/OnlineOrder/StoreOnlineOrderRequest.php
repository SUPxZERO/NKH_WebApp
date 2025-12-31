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
            'telegram_id' => ['nullable','integer'], // Allow Telegram ID for guest identification
            // Order Now flag - when true, system auto-assigns earliest available slot
            'order_now' => ['nullable','boolean'],
            // Accept either time_slot_id OR slot_date + slot_time (only required when order_now is not true)
            'time_slot_id' => ['nullable','exists:order_time_slots,id'],
            'slot_date' => ['nullable','required_without_all:time_slot_id,order_now','date','after_or_equal:today'],
            'slot_time' => ['nullable','required_without_all:time_slot_id,order_now','date_format:H:i,H:i:s'], // Accept both formats
            'notes' => ['nullable','string'],
            'promotion_code' => ['nullable','string'],
            'payment_mode' => ['nullable', 'string', 'in:pay_now,pay_on_delivery,pay_on_pickup'],
            'order_items' => ['required','array','min:1'],
            'order_items.*.menu_item_id' => ['required','exists:menu_items,id'],
            'order_items.*.quantity' => ['required','integer','min:1'],
        ];
    }
}

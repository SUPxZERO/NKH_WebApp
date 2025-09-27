<?php

namespace App\Http\Requests\Api\Order;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderItemRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'menu_item_id' => ['required','exists:menu_items,id'],
            'quantity' => ['required','integer','min:1'],
            'notes' => ['nullable','string','max:1000'],
        ];
    }
}

<?php

namespace App\Http\Requests\Api\Order;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'table_id' => ['required','exists:tables,id'],
            'notes' => ['nullable','string'],
        ];
    }
}

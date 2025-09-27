<?php

namespace App\Http\Requests\Api\Customer;

use Illuminate\Foundation\Http\FormRequest;

class StoreAddressRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'label' => ['required','string','max:100'],
            'address_line_1' => ['required','string','max:255'],
            'address_line_2' => ['nullable','string','max:255'],
            'city' => ['required','string','max:120'],
            'province' => ['required','string','max:120'],
            'postal_code' => ['required','string','max:20'],
            'latitude' => ['nullable','numeric','between:-90,90'],
            'longitude' => ['nullable','numeric','between:-180,180'],
            'delivery_instructions' => ['nullable','string'],
        ];
    }
}

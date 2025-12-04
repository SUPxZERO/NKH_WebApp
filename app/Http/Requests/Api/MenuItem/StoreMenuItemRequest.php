<?php

namespace App\Http\Requests\Api\MenuItem;

use Illuminate\Foundation\Http\FormRequest;

class StoreMenuItemRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'location_id' => ['required'],
            'category_id' => ['nullable', 'integer'],
            'sku' => ['nullable','string','max:50'],
            'slug' => ['required','string','max:150'],
            'price' => ['required','numeric','min:0'],
            'cost' => ['nullable','numeric','min:0'],
            'image' => ['nullable','image','mimes:jpeg,png,jpg,webp','max:10240'],
            'is_popular' => ['boolean'],
            'is_active' => ['boolean'],
            'display_order' => ['nullable','integer','min:0'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ];
    }
}

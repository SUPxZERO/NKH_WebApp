<?php

namespace App\Http\Requests\Api\MenuItem;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMenuItemRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'location_id' => ['sometimes','exists:locations,id'],
            'category_id' => ['sometimes','nullable','integer'],
            'sku' => ['sometimes','nullable','string','max:50'],
            'slug' => ['sometimes','string','max:150'],
            'price' => ['sometimes','numeric','min:0'],
            'cost' => ['sometimes','nullable','numeric','min:0'],
            'image' => ['sometimes','nullable'],
            'is_popular' => ['sometimes','boolean'],
            'is_active' => ['sometimes','boolean'],
            'display_order' => ['sometimes','integer','min:0'],
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ];
    }
}

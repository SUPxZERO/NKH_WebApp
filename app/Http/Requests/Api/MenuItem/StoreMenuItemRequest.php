<?php

namespace App\Http\Requests\Api\MenuItem;

use Illuminate\Foundation\Http\FormRequest;

class StoreMenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'location_id' => ['required'],
            'category_id' => ['nullable', 'integer'],
            'sku' => ['nullable', 'string', 'max:50'],
            'slug' => ['required', 'string', 'max:150'],
            'price' => ['required', 'numeric', 'min:0'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,svg', 'max:5120'], // 5MB
            'is_popular' => ['boolean'],
            'is_active' => ['boolean'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'prep_time' => ['nullable', 'integer', 'min:0'],
            'cook_time' => ['nullable', 'integer', 'min:0'],
            'serving_size' => ['nullable', 'string', 'max:50'],
            'spice_level' => ['nullable', 'integer', 'min:0', 'max:5'],
            'calories' => ['nullable', 'integer', 'min:0'],
            'nutrition' => ['nullable', 'array'], // JSON
            'ingredients' => ['nullable', 'array'], // JSON
            'allergens' => ['nullable', 'array'], // JSON
            'dietary_tags' => ['nullable', 'array'], // JSON
            'availability_status' => ['nullable', 'in:available,low_stock,out_of_stock,seasonal'],
            'availability_note' => ['nullable', 'string', 'max:255'],
        ];
    }
}

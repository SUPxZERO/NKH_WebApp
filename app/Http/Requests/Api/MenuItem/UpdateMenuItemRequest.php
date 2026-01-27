<?php

namespace App\Http\Requests\Api\MenuItem;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $menuItem = $this->route('menuItem');
        // Handle both implicit model binding (returns object) and explicit binding (returns ID)
        $id = $menuItem instanceof \App\Models\MenuItem ? $menuItem->id : $menuItem;

        return [
            'location_id' => ['sometimes', 'exists:locations,id'],
            'category_id' => ['sometimes', 'nullable', 'integer'],
            'sku' => [
                'sometimes',
                'nullable',
                'string',
                'max:50',
                \Illuminate\Validation\Rule::unique('menu_items')->ignore($id)
            ],
            'slug' => [
                'sometimes',
                'string',
                'max:150',
                \Illuminate\Validation\Rule::unique('menu_items')->ignore($id)
            ],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'cost' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'image' => ['sometimes', 'nullable', 'image', 'mimes:jpeg,png,jpg,gif,svg', 'max:5120'], // 5MB
            'is_popular' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'display_order' => ['sometimes', 'integer', 'min:0'],
            'name' => ['sometimes', 'string', 'max:255'],
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

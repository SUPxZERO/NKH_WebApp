<?php

namespace App\Http\Requests\Api\Category;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'location_id' => ['nullable','exists:locations,id'],
            'slug' => ['sometimes','string','max:150'],
            'display_order' => ['sometimes','integer','min:0'],
            'is_active' => ['sometimes','boolean'],
        ];
    }
}

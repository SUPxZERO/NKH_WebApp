<?php

namespace App\Http\Requests\Api\Category;

use Illuminate\Foundation\Http\FormRequest;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'location_id' => ['nullable', 'exists:locations,id'],
            'parent_id' => ['nullable', 'exists:categories,id'],
            'slug' => [
                'required',
                'string',
                'max:150',
                // Ensure slug is unique for the given parent_id
                function ($attribute, $value, $fail) {
                    $parentId = $this->input('parent_id');
                    $exists = \App\Models\Category::where('slug', $value)
                        ->where(function ($query) use ($parentId) {
                            if ($parentId) {
                                $query->where('parent_id', $parentId);
                            } else {
                                $query->whereNull('parent_id');
                            }
                        })
                        ->exists();

                    if ($exists) {
                        $fail('A category with this slug already exists at this level.');
                    }
                },
            ],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,svg', 'max:5120'], // 5MB
        ];
    }
}

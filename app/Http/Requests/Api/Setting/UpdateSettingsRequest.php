<?php

namespace App\Http\Requests\Api\Setting;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['admin', 'manager']);
    }

    public function rules(): array
    {
        return [
            'location_id' => ['nullable', 'exists:locations,id'],
            'settings' => ['required', 'array'],
            'settings.*' => ['required'], // Allow any type of value
        ];
    }

    public function messages(): array
    {
        return [
            'settings.required' => 'Settings data is required',
            'settings.array' => 'Settings must be provided as key-value pairs',
        ];
    }
}

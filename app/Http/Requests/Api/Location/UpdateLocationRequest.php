<?php

namespace App\Http\Requests\Api\Location;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLocationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('operating_hours') && is_string($this->input('operating_hours'))) {
            $this->merge([
                'operating_hours' => json_decode($this->input('operating_hours'), true),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:50', Rule::unique('locations')->ignore($this->route('location'))],
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'logo_path' => 'nullable|image|max:2048',
            'tax_registration_number' => 'nullable|string|max:100',
            'default_tax_rate' => 'nullable|numeric|between:0,100',
            'address_line1' => 'required|string|max:255',
            'address_line2' => 'nullable|string|max:255',
            'city' => 'required|string|max:100',
            'state' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'required|string|max:100',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'is_active' => 'boolean',
            'accepts_online_orders' => 'boolean',
            'accepts_pickup' => 'boolean',
            'accepts_delivery' => 'boolean',
            'operating_hours' => 'nullable|array',
            'operating_hours.*.day_of_week' => 'required|integer|between:0,6',
            'operating_hours.*.service_type' => 'required|string|in:dine-in,pickup,delivery',
            'operating_hours.*.opening_time' => ['required', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'operating_hours.*.closing_time' => ['required', 'regex:/^\d{2}:\d{2}(:\d{2})?$/', 'after:operating_hours.*.opening_time'],
        ];
    }
}

<?php

namespace App\Http\Requests\Api\Customer;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['admin', 'manager']) ?? false;
    }

    public function rules(): array
    {
        $customerId = $this->route('customer')?->user_id;

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', 'unique:users,email,' . $customerId],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30', 'unique:users,phone,' . $customerId],
            'password' => ['sometimes', 'string', 'min:8'],
            'is_active' => ['sometimes', 'boolean'],
            'preferred_location_id' => ['sometimes', 'nullable', 'exists:locations,id'],
            'birth_date' => ['sometimes', 'nullable', 'date'],
            'gender' => ['sometimes', 'nullable', 'in:male,female,other'],
            'preferences' => ['sometimes', 'nullable', 'array'],
            'preferences.*' => ['string'],
            'points_balance' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ];
    }
}

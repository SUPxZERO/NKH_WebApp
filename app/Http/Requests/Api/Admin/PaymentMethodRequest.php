<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Foundation\Http\FormRequest;

class PaymentMethodRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('manage_payment_methods');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:100',
            'description' => 'nullable|string|max:255',
            'processing_fee' => 'sometimes|numeric|min:0|max:100',
            'display_order' => 'sometimes|integer|min:0',
            'configuration' => 'sometimes|array',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'processing_fee.max' => 'Processing fee cannot exceed 100%.',
            'processing_fee.min' => 'Processing fee must be a positive number.',
            'display_order.min' => 'Display order must be a positive number.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'processing_fee' => 'processing fee',
            'display_order' => 'display order',
        ];
    }
}

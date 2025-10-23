<?php

namespace App\Http\Requests\Api\CustomerRequest;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCustomerRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Add proper authorization logic
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:open,in_progress,resolved,closed'],
            'admin_notes' => ['nullable', 'string', 'max:1000'],
            'resolution' => ['required_if:status,resolved', 'nullable', 'string', 'max:1000'],
        ];
    }
}
<?php

namespace App\Http\Requests\Api\Employee;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['admin', 'manager']);
    }

    public function rules(): array
    {
        $employeeId = $this->route('employee')->id;
        $userId = $this->route('employee')->user_id;

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'phone' => ['nullable', 'string', 'max:30', Rule::unique('users', 'phone')->ignore($userId)],
            'password' => ['sometimes', 'string', 'min:8'],
            'role' => ['sometimes', 'string', 'in:admin,manager,cashier,waiter,chef,employee'],
            'position_id' => ['sometimes', 'exists:positions,id'],
            'salary_type' => ['sometimes', 'in:hourly,monthly'],
            'salary' => ['nullable', 'numeric', 'min:0'],
            'status' => ['sometimes', 'in:active,inactive,terminated,on_leave'],
            'is_active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'role.in' => 'Role must be one of: admin, manager, cashier, waiter, chef, employee',
            'email.unique' => 'Email address already exists',
            'phone.unique' => 'Phone number already exists',
        ];
    }
}

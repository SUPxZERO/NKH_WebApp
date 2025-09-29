<?php

namespace App\Http\Requests\Api\Employee;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['admin', 'manager']);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30', 'unique:users,phone'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'string', 'in:admin,manager,waiter'],
            'location_id' => ['required', 'exists:locations,id'],
            'position_id' => ['required', 'exists:positions,id'],
            'employee_number' => ['required', 'string', 'max:50', 'unique:employees,employee_number'],
            'hire_date' => ['required', 'date'],
            'salary' => ['nullable', 'numeric', 'min:0'],
            'hourly_rate' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'role.in' => 'Role must be one of: admin, manager, waiter',
            'employee_number.unique' => 'Employee number already exists',
            'email.unique' => 'Email address already exists',
            'phone.unique' => 'Phone number already exists',
        ];
    }
}

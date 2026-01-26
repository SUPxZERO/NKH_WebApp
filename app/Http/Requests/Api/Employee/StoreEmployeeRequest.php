<?php

namespace App\Http\Requests\Api\Employee;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Permission is checked via middleware, so always authorize here
        // The route has permission:employees.create middleware
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30', 'unique:users,phone'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'string', 'in:admin,manager,cashier,waiter,chef,employee'],
            'location_id' => ['required', 'exists:locations,id'],
            'position_id' => ['required', 'exists:positions,id'],
            'employee_code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('employees', 'employee_code')->where(fn($q) => $q->where('location_id', $this->location_id)),
            ],
            'hire_date' => ['required', 'date'],
            'salary_type' => ['sometimes', 'in:hourly,monthly'],
            'salary' => ['nullable', 'numeric', 'min:0'],
            'address' => ['nullable', 'string', 'max:500'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'status' => ['sometimes', 'in:active,inactive,terminated,on_leave'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'role.in' => 'Role must be one of: admin, manager, cashier, waiter, chef, employee',
            'employee_code.unique' => 'Employee number already exists',
            'email.unique' => 'Email address already exists',
            'phone.unique' => 'Phone number already exists',
        ];
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Employee\StoreEmployeeRequest;
use App\Http\Requests\Api\Employee\UpdateEmployeeRequest;
use App\Http\Resources\EmployeeResource;
use App\Models\Employee;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $query = Employee::with(['user.roles', 'position', 'location']);
        
        // Filter by location if provided
        if ($request->has('location_id')) {
            $query->where('location_id', $request->location_id);
        }
        
        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }
        
        $employees = $query->paginate($request->get('per_page', 15));
        
        return EmployeeResource::collection($employees);
    }

    public function store(StoreEmployeeRequest $request): EmployeeResource
    {
        $data = $request->validated();
        
        $employee = DB::transaction(function () use ($data) {
            // Create user account
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => Hash::make($data['password']),
                'is_active' => $data['is_active'] ?? true,
            ]);
            
            // Assign employee role
            $role = Role::where('slug', $data['role'])->firstOrFail();
            $user->roles()->attach($role->id);
            
            // Create employee record
            $employee = Employee::create([
                'user_id' => $user->id,
                'location_id' => $data['location_id'],
                'position_id' => $data['position_id'],
                'employee_code' => $data['employee_code'],
                'hire_date' => $data['hire_date'],
                'salary_type' => $data['salary_type'] ?? 'monthly',
                'salary' => $data['salary'] ?? null,
                'status' => $data['status'] ?? 'active',
            ]);
            
            return $employee->load(['user', 'position', 'location']);
        });
        
        return new EmployeeResource($employee);
    }

    public function show(Employee $employee): EmployeeResource
    {
        return new EmployeeResource($employee->load(['user', 'position', 'location']));
    }

    public function update(UpdateEmployeeRequest $request, Employee $employee): EmployeeResource
    {
        $data = $request->validated();
        
        DB::transaction(function () use ($employee, $data) {
            // Update user information
            if (isset($data['name']) || isset($data['email']) || isset($data['phone'])) {
                $userUpdate = [];
                if (isset($data['name'])) $userUpdate['name'] = $data['name'];
                if (isset($data['email'])) $userUpdate['email'] = $data['email'];
                if (isset($data['phone'])) $userUpdate['phone'] = $data['phone'];
                if (isset($data['is_active'])) $userUpdate['is_active'] = $data['is_active'];
                
                $employee->user()->update($userUpdate);
            }
            
            // Update password if provided
            if (isset($data['password'])) {
                $employee->user()->update(['password' => Hash::make($data['password'])]);
            }
            
            // Update role if provided
            if (isset($data['role'])) {
                $role = Role::where('slug', $data['role'])->firstOrFail();
                $employee->user->roles()->sync([$role->id]);
            }
            
            // Update employee record
            $employeeUpdate = [];
            if (isset($data['position_id'])) $employeeUpdate['position_id'] = $data['position_id'];
            if (isset($data['salary_type'])) $employeeUpdate['salary_type'] = $data['salary_type'];
            if (isset($data['salary'])) $employeeUpdate['salary'] = $data['salary'];
            if (isset($data['status'])) $employeeUpdate['status'] = $data['status'];
            
            if (!empty($employeeUpdate)) {
                $employee->update($employeeUpdate);
            }
        });
        
        return new EmployeeResource($employee->fresh(['user', 'position', 'location']));
    }

    public function destroy(Employee $employee): JsonResponse
    {
        DB::transaction(function () use ($employee) {
            // Deactivate instead of hard delete to preserve data integrity
            $employee->update(['status' => 'inactive']);
            $employee->user()->update(['is_active' => false]);
        });
        
        return response()->json(['message' => 'Employee deactivated successfully.']);
    }
}

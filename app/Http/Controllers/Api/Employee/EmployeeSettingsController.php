<?php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeSettingsController extends Controller
{
    /**
     * Get work preferences for the authenticated employee
     */
    public function getWorkPreferences(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $employee = Employee::where('user_id', $user->id)->first();
        
        if (!$employee) {
            return response()->json([
                'success' => true,
                'data' => [
                    'preferred_stations' => ['pos'],
                    'preferred_shifts' => ['morning'],
                    'available_days' => ['mon', 'tue', 'wed', 'thu', 'fri'],
                    'max_hours_per_week' => 40,
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'preferred_stations' => $employee->preferred_stations ?? ['pos'],
                'preferred_shifts' => $employee->preferred_shifts ?? ['morning'],
                'available_days' => $employee->available_days ?? ['mon', 'tue', 'wed', 'thu', 'fri'],
                'max_hours_per_week' => $employee->max_hours_per_week ?? 40,
            ],
        ]);
    }

    /**
     * Update work preferences for the authenticated employee
     */
    public function updateWorkPreferences(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'preferred_stations' => 'sometimes|array',
            'preferred_stations.*' => 'string|in:pos,kitchen,delivery,service',
            'preferred_shifts' => 'sometimes|array',
            'preferred_shifts.*' => 'string|in:morning,afternoon,evening',
            'available_days' => 'sometimes|array',
            'available_days.*' => 'string|in:mon,tue,wed,thu,fri,sat,sun',
            'max_hours_per_week' => 'sometimes|integer|min:10|max:60',
        ]);

        $employee = Employee::where('user_id', $user->id)->first();
        
        if (!$employee) {
            // Create employee record if it doesn't exist
            $employee = Employee::create([
                'user_id' => $user->id,
                'employee_code' => 'EMP-' . strtoupper(substr(md5($user->id . time()), 0, 6)),
                'hire_date' => now(),
                'employment_status' => 'active',
                'preferred_stations' => $validated['preferred_stations'] ?? ['pos'],
                'preferred_shifts' => $validated['preferred_shifts'] ?? ['morning'],
                'available_days' => $validated['available_days'] ?? ['mon', 'tue', 'wed', 'thu', 'fri'],
                'max_hours_per_week' => $validated['max_hours_per_week'] ?? 40,
            ]);
        } else {
            $employee->update($validated);
        }

        return response()->json([
            'success' => true,
            'message' => 'Work preferences updated successfully',
            'data' => [
                'preferred_stations' => $employee->preferred_stations,
                'preferred_shifts' => $employee->preferred_shifts,
                'available_days' => $employee->available_days,
                'max_hours_per_week' => $employee->max_hours_per_week,
            ],
        ]);
    }

    /**
     * Get emergency contact for the authenticated employee
     */
    public function getEmergencyContact(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $employee = Employee::where('user_id', $user->id)->first();
        
        if (!$employee) {
            return response()->json([
                'success' => true,
                'data' => [
                    'emergency_contact_name' => '',
                    'emergency_contact_phone' => '',
                    'emergency_contact_relation' => '',
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'emergency_contact_name' => $employee->emergency_contact_name ?? '',
                'emergency_contact_phone' => $employee->emergency_contact_phone ?? '',
                'emergency_contact_relation' => $employee->emergency_contact_relation ?? '',
            ],
        ]);
    }

    /**
     * Update emergency contact for the authenticated employee
     */
    public function updateEmergencyContact(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'emergency_contact_relation' => 'nullable|string|in:spouse,parent,sibling,friend,other',
        ]);

        $employee = Employee::where('user_id', $user->id)->first();
        
        if (!$employee) {
            // Create employee record if it doesn't exist
            $employee = Employee::create([
                'user_id' => $user->id,
                'employee_code' => 'EMP-' . strtoupper(substr(md5($user->id . time()), 0, 6)),
                'hire_date' => now(),
                'employment_status' => 'active',
                'emergency_contact_name' => $validated['emergency_contact_name'] ?? null,
                'emergency_contact_phone' => $validated['emergency_contact_phone'] ?? null,
                'emergency_contact_relation' => $validated['emergency_contact_relation'] ?? null,
            ]);
        } else {
            $employee->update($validated);
        }

        return response()->json([
            'success' => true,
            'message' => 'Emergency contact updated successfully',
            'data' => [
                'emergency_contact_name' => $employee->emergency_contact_name,
                'emergency_contact_phone' => $employee->emergency_contact_phone,
                'emergency_contact_relation' => $employee->emergency_contact_relation,
            ],
        ]);
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'employee_code' => $this->employee_code,
            'hire_date' => $this->hire_date?->format('Y-m-d'),
            'salary_type' => $this->salary_type,
            'salary' => $this->salary,
            'status' => $this->status,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // User information
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'phone' => $this->user->phone,
                'is_active' => $this->user->is_active,
                'roles' => $this->user->roles->pluck('slug'),
            ],
            
            // Position information
            'position' => $this->whenLoaded('position', function () {
                return [
                    'id' => $this->position->id,
                    'title' => $this->position->title,
                    'description' => $this->position->description,
                ];
            }),
            
            // Location information
            'location' => $this->whenLoaded('location', function () {
                return [
                    'id' => $this->location->id,
                    'name' => $this->location->name,
                    'address_line1' => $this->location->address_line1,
                ];
            }),
        ];
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LeaveRequest;
use App\Models\Employee;
use Carbon\Carbon;

class LeaveRequestSeeder extends Seeder
{
    public function run(): void
    {
        $employees = Employee::all();
        
        // Generate leave requests for the next 90 days
        $startDate = Carbon::now();
        $endDate = Carbon::now()->addDays(90);
        
        $employees->each(function ($employee) use ($startDate, $endDate) {
            // Create 1-3 leave requests per employee
            $requestCount = rand(1, 3);
            
            for ($i = 0; $i < $requestCount; $i++) {
                // Generate random start date between now and 90 days
                $requestStartDate = Carbon::now()->addDays(rand(1, 85));
                $duration = rand(1, 5); // 1-5 days off
                
                LeaveRequest::create([
                    'employee_id' => $employee->id,
                    'location_id' => $employee->location_id,
                    'type' => $this->getRequestType(),
                    'start_date' => $requestStartDate,
                    'end_date' => $requestStartDate->copy()->addDays($duration),
                    'status' => $this->getRequestStatus($requestStartDate),
                    'reason' => $this->getReason(),
                    'created_at' => $requestStartDate->copy()->subDays(rand(7, 14)),
                    'updated_at' => $requestStartDate->copy()->subDays(rand(1, 7)),
                ]);
            }
        });
    }

    private function getRequestType(): string
    {
        $types = ['annual', 'sick', 'unpaid', 'other'];
        return $types[array_rand($types)];
    }

    private function getRequestStatus(Carbon $startDate): string
    {
        if ($startDate->isPast()) {
            $statuses = ['approved', 'rejected', 'cancelled'];
            return $statuses[array_rand($statuses)];
        }
        
        return array_rand([
            'pending' => 3, // Higher weight for pending
            'approved' => 1
        ]);
    }

    private function getReason(): string
    {
        $reasons = [
            "Annual vacation",
            "Family emergency",
            "Medical appointment",
            "Personal matters",
            "Family celebration",
            "Religious observance",
            "Attending wedding",
            "Home emergency"
        ];

        return $reasons[array_rand($reasons)];
    }

    private function getNotes(): ?string
    {
        $notes = [
            "Backup staff arranged",
            "Will be available by phone",
            "Second time request this year",
            "Emergency contact provided",
            "Covered by team member",
            null, null, null // Add nulls for variety
        ];

        return $notes[array_rand($notes)];
    }
}
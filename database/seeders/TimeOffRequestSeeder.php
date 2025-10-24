<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TimeOffRequest;
use App\Models\Employee;
use Carbon\Carbon;

class TimeOffRequestSeeder extends Seeder
{
    public function run(): void
    {
        $employees = Employee::all();
        
        // Generate time off requests for the next 90 days
        $startDate = Carbon::now();
        $endDate = Carbon::now()->addDays(90);
        
        $employees->each(function ($employee) use ($startDate, $endDate) {
            // Create 1-3 time off requests per employee
            $requestCount = rand(1, 3);
            
            for ($i = 0; $i < $requestCount; $i++) {
                // Generate random start date between now and 90 days
                $requestStartDate = Carbon::now()->addDays(rand(1, 85));
                $duration = rand(1, 5); // 1-5 days off
                
                TimeOffRequest::create([
                    'employee_id' => $employee->id,
                    'request_type' => $this->getRequestType(),
                    'start_date' => $requestStartDate,
                    'end_date' => $requestStartDate->copy()->addDays($duration),
                    'status' => $this->getRequestStatus($requestStartDate),
                    'reason' => $this->getReason(),
                    'notes' => $this->getNotes(),
                    'created_at' => $requestStartDate->copy()->subDays(rand(7, 14)),
                    'updated_at' => $requestStartDate->copy()->subDays(rand(1, 7)),
                ]);
            }
        });
    }

    private function getRequestType(): string
    {
        return array_rand([
            'vacation' => true,
            'sick_leave' => true,
            'personal_leave' => true,
            'bereavement' => true,
            'unpaid_leave' => true
        ]);
    }

    private function getRequestStatus(Carbon $startDate): string
    {
        if ($startDate->isPast()) {
            return array_rand([
                'approved' => true,
                'completed' => true,
                'cancelled' => true
            ]);
        }
        
        return array_rand([
            'pending' => true,
            'approved' => true,
            'approved' => true
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
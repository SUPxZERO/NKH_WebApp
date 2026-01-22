<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Employee;
use App\Models\Shift;
use App\Models\ShiftSwap;
use Carbon\Carbon;

class RealShiftSwapSeeder extends Seeder
{
    public function run()
    {
        $this->command->info('🚀 Starting Real Shift Swap Seeder for Testing...');

        // 1. Identify Test User (The "Logged In" User)
        // Try to find a user who is likely the one being used for testing
        $testUser = User::where('email', 'like', '%employee%')->first() 
                 ?? User::whereHas('roles', fn($q) => $q->where('name', 'employee'))->first()
                 ?? User::first();

        if (!$testUser || !$testUser->employee) {
            $this->command->error('❌ No suitable employee user found for testing.');
            $this->command->info('   Please run UserSeeder and EmployeeSeeder first.');
            return;
        }

        $testEmployee = $testUser->employee;
        $this->command->info("👤 Targeting Test User: {$testUser->name} (Employee ID: {$testEmployee->id})");
        $this->command->info("   - Position: " . ($testEmployee->position->name ?? 'None'));

        // 2. Clear previous swaps for cleanliness (optional, but good for reliable state)
        // ShiftSwap::truncate(); // Commented out to avoid wiping other valid data if mixed

        // 3. Setup Helper Data
        $now = now();
        $coworkers = Employee::where('id', '!=', $testEmployee->id)
                             ->where('position_id', $testEmployee->position_id)
                             ->get();
        
        if ($coworkers->isEmpty()) {
            // Fallback: get any coworkers if strict position match fails
            $coworkers = Employee::where('id', '!=', $testEmployee->id)->get();
        }

        if ($coworkers->isEmpty()) {
            $this->command->error('❌ No coworkers found to swap with.');
            return;
        }
        
        $manager = User::whereHas('roles', fn($q) => $q->where('name', 'admin'))->first() ?? User::first();

        // ==============================================
        // SECTION A: POPULATE "MY REQUESTS"
        // ==============================================
        $this->command->info('📝 Generating "My Requests" data...');

        // Create shifts for the test employee if they don't have enough
        $this->ensureShiftsForEmployee($testEmployee, 10);
        $myShifts = Shift::where('employee_id', $testEmployee->id)
                         ->where('date', '>', $now)
                         ->orderBy('date')
                         ->get();

        $scenarios = [
            ['status' => 'pending', 'type' => 'give_away', 'reason' => 'Doctor appointment'],
            ['status' => 'pending', 'type' => 'trade', 'reason' => 'Need Saturday off'],
            ['status' => 'accepted_by_peer', 'type' => 'give_away', 'reason' => 'Family emergency'],
            ['status' => 'approved', 'type' => 'give_away', 'reason' => 'Planned vacation'],
            ['status' => 'denied', 'type' => 'give_away', 'reason' => 'concert tickets', 'denial' => 'Too short notice'],
            ['status' => 'cancelled', 'type' => 'trade', 'reason' => 'Changed my mind'],
        ];

        foreach ($scenarios as $index => $scenario) {
            if ($index >= $myShifts->count()) break;
            
            $shift = $myShifts[$index];
            $recipient = ($scenario['status'] !== 'pending' && $scenario['status'] !== 'cancelled') 
                         ? $coworkers->random() 
                         : null;

            $swap = ShiftSwap::create([
                'requester_id' => $testEmployee->id,
                'recipient_id' => $recipient?->id,
                'shift_id' => $shift->id,
                'type' => $scenario['type'],
                'status' => $scenario['status'],
                'reason' => $scenario['reason'],
                'created_at' => $now->copy()->subDays(rand(1, 5)),
                'denial_reason' => $scenario['denial'] ?? null,
            ]);

            // Add metadata based on status
            if ($scenario['status'] === 'approved') {
                $swap->approved_by = $manager->id;
                $swap->approved_at = $now->copy()->subHours(rand(1, 24));
                $swap->save();
            } else if ($scenario['status'] === 'denied') {
                $swap->approved_by = $manager->id; // Denied by manager
                $swap->approved_at = $now->copy()->subHours(rand(1, 24));
                $swap->save();
            }
        }

        // ==============================================
        // SECTION B: POPULATE "MARKETPLACE"
        // ==============================================
        $this->command->info('🛒 Generating "Marketplace" data...');
        
        // We need shifts from coworkers that are AVAILABLE (status = pending)
        // Create 5-8 marketplace items
        $marketplaceCount = 0;
        
        foreach($coworkers->take(5) as $coworker) {
            $this->ensureShiftsForEmployee($coworker, 5);
            $coworkerShifts = Shift::where('employee_id', $coworker->id)
                                   ->where('date', '>', $now)
                                   ->doesntHave('swaps') // Only pick shifts without existing active swaps
                                   ->take(2)
                                   ->get();

            foreach($coworkerShifts as $shift) {
                ShiftSwap::create([
                    'requester_id' => $coworker->id,
                    'shift_id' => $shift->id,
                    'type' => rand(0, 1) ? 'give_away' : 'trade',
                    'status' => 'pending',
                    'reason' => $this->getRandomReason(),
                    'created_at' => $now->copy()->subHours(rand(1, 48)),
                ]);
                $marketplaceCount++;
            }
        }

        $this->command->info("✅ Seeding Complete!");
        $this->command->info("   - Created " . count($scenarios) . " 'My Requests' entries.");
        $this->command->info("   - Created {$marketplaceCount} 'Marketplace' entries.");
    }

    private function ensureShiftsForEmployee($employee, $count)
    {
        $currentShifts = Shift::where('employee_id', $employee->id)->where('date', '>', now())->count();
        if ($currentShifts >= $count) return;

        $needed = $count - $currentShifts;
        for ($i = 0; $i < $needed; $i++) {
            Shift::create([
                'employee_id' => $employee->id,
                'date' => now()->addDays(rand(1, 30))->toDateString(),
                'start_time' => '09:00:00',
                'end_time' => '17:00:00',
                'position_id' => $employee->position_id ?? 1,
                'location_id' => 1, // Default location
                'status' => 'scheduled'
            ]);
        }
    }

    private function getRandomReason()
    {
        $reasons = [
            'Family visiting town',
            'Car broke down',
            'Feeling under the weather',
            'Need to study for finals',
            'Concert tickets',
            'Just need a break',
            'Clocking out early',
            'Overtime trade?'
        ];
        return $reasons[array_rand($reasons)];
    }
}

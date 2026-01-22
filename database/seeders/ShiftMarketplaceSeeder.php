<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\Shift;
use App\Models\ShiftSwap;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ShiftMarketplaceSeeder extends Seeder
{
    /**
     * Seed the shift marketplace with realistic, chained data
     * 
     * This creates a realistic marketplace scenario with:
     * - Employees offering shifts (give_away)
     * - Employees looking to trade shifts
     * - Various statuses (pending, accepted_by_peer, approved)
     * - Related data chains showing marketplace activity
     */
    public function run(): void
    {
        // Get employees (we'll use existing ones)
        $employees = Employee::with('user')->take(10)->get();
        
        if ($employees->count() < 5) {
            $this->command->warn('Not enough employees found. Please seed employees first.');
            return;
        }

        // Get upcoming shifts for the next 2 weeks (or just get any shifts)
        $upcomingShifts = Shift::where('date', '>=', now()->toDateString())
            ->where('date', '<=', now()->addWeeks(2)->toDateString())
            ->get();
        
        // If no upcoming shifts, just get any shifts
        if ($upcomingShifts->count() < 10) {
            $upcomingShifts = Shift::take(20)->get();
        }

        if ($upcomingShifts->count() < 10) {
            $this->command->warn('Not enough upcoming shifts found. Please seed shifts first.');
            return;
        }

        $this->command->info('Seeding Shift Marketplace with related data chains...');

        // Clear existing swap data
        ShiftSwap::truncate();

        // Scenario 1: Employee wants to give away a shift (urgent)
        if ($upcomingShifts->count() > 0) {
            ShiftSwap::create([
                'requester_id' => $employees[0]->id,
                'shift_id' => $upcomingShifts[0]->id,
                'type' => 'give_away',
                'status' => 'pending',
                'reason' => 'Family emergency - need someone to cover my shift',
                'created_at' => now()->subHours(3),
            ]);
            $this->command->info('✓ Created urgent shift giveaway');
        }

        // Scenario 2: Employee offering shift (scheduled)
        if ($upcomingShifts->count() > 1) {
            ShiftSwap::create([
                'requester_id' => $employees[1]->id,
                'shift_id' => $upcomingShifts[1]->id,
                'type' => 'give_away',
                'status' => 'pending',
                'reason' => 'Doctor appointment scheduled',
                'created_at' => now()->subDays(1),
            ]);
            $this->command->info('✓ Created scheduled shift giveaway');
        }

        // Scenario 3: Shift swap that was claimed by someone (accepted_by_peer)
        if ($upcomingShifts->count() > 2 && $employees->count() >= 4) {
            ShiftSwap::create([
                'requester_id' => $employees[2]->id,
                'recipient_id' => $employees[3]->id,
                'shift_id' => $upcomingShifts[2]->id,
                'type' => 'give_away',
                'status' => 'accepted_by_peer',
                'reason' => 'Personal commitment - grateful for coverage!',
                'responded_at' => now()->subHours(12),
                'created_at' => now()->subDays(2),
            ]);
            $this->command->info('✓ Created accepted shift swap waiting for manager approval');
        }

        // Scenario 4: Approved shift swap (manager already approved)
        if ($upcomingShifts->count() > 3 && $employees->count() >= 5) {
            ShiftSwap::create([
                'requester_id' => $employees[3]->id,
                'recipient_id' => $employees[4]->id,
                'shift_id' => $upcomingShifts[3]->id,
                'type' => 'give_away',
                'status' => 'approved',
                'reason' => 'Switching shifts to accommodate classes',
                'responded_at' => now()->subDays(1),
                'approved_by' => 1,
                'approved_at' => now()->subHours(6),
                'created_at' => now()->subDays(3),
            ]);
            $this->command->info('✓ Created approved shift swap');
        }

        // Scenario 5: Trade request (wants to swap, not just give away)
        if ($upcomingShifts->count() > 4 && $employees->count() >= 6) {
            ShiftSwap::create([
                'requester_id' => $employees[5]->id,
                'shift_id' => $upcomingShifts[4]->id,
                'type' => 'trade',
                'status' => 'pending',
                'reason' => 'Looking to trade this shift for a weekend shift',
                'created_at' => now()->subHours(8),
            ]);
            $this->command->info('✓ Created trade request');
        }

        // Scenario 6: Multiple shifts available (active marketplace)
        $maxScenarios = min(10, $upcomingShifts->count(), $employees->count());
        for ($i = 5; $i < $maxScenarios; $i++) {
            $reasons = [
                'Need to study for exams',
                'Birthday celebration planned',
                'Out of town for the weekend',
                'Volunteering commitment',
                'Unexpected schedule conflict',
                'Need extra hours - willing to take over shifts',
                'Prefer evening shifts over morning ones',
            ];

            ShiftSwap::create([
                'requester_id' => $employees[$i % $employees->count()]->id,
                'shift_id' => $upcomingShifts[$i]->id,
                'type' => $i % 3 === 0 ? 'trade' : 'give_away',
                'status' => 'pending',
                'reason' => $reasons[array_rand($reasons)],
                'created_at' => now()->subHours(rand(1, 48)),
            ]);
        }
        
        $this->command->info('✓ Created additional marketplace listings');

        // Scenario 7: Cancelled request (employee found alternative solution)
        if ($upcomingShifts->count() > 10 && $employees->count() >= 8) {
            ShiftSwap::create([
                'requester_id' => $employees[7]->id,
                'shift_id' => $upcomingShifts[10]->id,
                'type' => 'give_away',
                'status' => 'cancelled',
                'reason' => 'Conflict resolved - no longer need coverage',
                'created_at' => now()->subDays(1),
            ]);
            $this->command->info('✓ Created cancelled swap request');
        }

        // Scenario 8: Denied request (manager rejected)
        if ($upcomingShifts->count() > 11 && $employees->count() >= 10) {
            ShiftSwap::create([
                'requester_id' => $employees[8]->id,
                'recipient_id' => $employees[9]->id,
                'shift_id' => $upcomingShifts[11]->id,
                'type' => 'give_away',
                'status' => 'denied',
                'reason' => 'Last minute request - too short notice',
                'responded_at' => now()->subHours(2),
                'approved_by' => 1,
                'approved_at' => now()->subHours(1),
                'created_at' => now()->subHours(4),
            ]);
            $this->command->info('✓ Created denied swap request');
        }

        $totalSwaps = ShiftSwap::count();
        $pendingSwaps = ShiftSwap::where('status', 'pending')->count();
        $acceptedSwaps = ShiftSwap::where('status', 'accepted_by_peer')->count();

        $this->command->info("\n📊 Marketplace Seeding Complete:");
        $this->command->info("   Total swap requests: {$totalSwaps}");
        $this->command->info("   Pending (available): {$pendingSwaps}");
        $this->command->info("   Awaiting approval: {$acceptedSwaps}");
        $this->command->info("\n✅ Shift Marketplace is now populated with realistic, chained data!");
    }
}

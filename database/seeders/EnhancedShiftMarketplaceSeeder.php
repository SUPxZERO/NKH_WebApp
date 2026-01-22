<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\Position;
use App\Models\Shift;
use App\Models\ShiftSwap;
use App\Models\User;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class EnhancedShiftMarketplaceSeeder extends Seeder
{
    private $servers = [];
    private $chefs = [];
    private $bartenders = [];
    private $cashiers = [];
    private $allEmployees = [];
    
    /**
     * Enhanced shift marketplace seeder with realistic, interconnected data chains
     * 
     * Creates 6 employee behavior profiles:
     * 1. The Busy Server - gives away 2 shifts, claims 1
     * 2. The Extra Hours Seeker - claims multiple shifts
     * 3. The Reducer - gives away multiple, claims none
     * 4. The Emergency Responder - last-minute swap
     * 5. The Planner - far-future swaps
     * 6. The Trader - prefers trades over give-aways
     */
    public function run(): void
    {
        $this->command->info('🚀 Enhanced Shift Marketplace Seeder Starting...');
        
        // Step 1: Load and categorize employees by position
        $this->loadEmployeesByPosition();
        
        if (empty($this->allEmployees)) {
            $this->command->error('❌ No employees found. Please seed employees first.');
            return;
        }
        
        // Step 2: Get shifts grouped by desirability and time
        $shifts = $this->categorizeShifts();
        
        if ($shifts['all']->count() < 20) {
            $this->command->error('❌ Not enough shifts found. Please seed shifts first.');
            return;
        }
        
        // Step 3: Clear existing swap data
        ShiftSwap::truncate();
        $this->command->info('🗑️  Cleared existing swap data');
        
        // Step 4: Create employee behavior profiles
        $this->command->info('👥 Creating employee behavior profiles...');
        
        $profiles = $this->createEmployeeProfiles($shifts);
        
        // Step 5: Generate interconnected swap chains
        $this->command->info('🔗 Generating data chains...');
        
        $swapCount = 0;
        
        // Chain 1: The Busy Server
        $swapCount += $this->createBusyServerChain($profiles['busyServer'], $shifts);
        
        // Chain 2: The Extra Hours Seeker
        $swapCount += $this->createExtraHoursSeekerChain($profiles['extraHoursSeeker'], $shifts);
        
        // Chain 3: The Reducer
        $swapCount += $this->createReducerChain($profiles['reducer'], $shifts);
        
        // Chain 4: The Emergency Responder
        $swapCount += $this->createEmergencyChain($profiles['emergencyResponder'], $shifts);
        
        // Chain 5: The Planner
        $swapCount += $this->createPlannerChain($profiles['planner'], $shifts);
        
        // Chain 6: The Trader
        $swapCount += $this->createTraderChain($profiles['trader'], $shifts);
        
        // Chain 7: Popular Shift with Competing Claims
        $swapCount += $this->createPopularShiftChain($shifts);
        
        // Chain 8: Manager Approval Patterns
        $swapCount += $this->createManagerPatternChain($shifts);
        
        // Chain 9: Position-Based Networks
        $swapCount += $this->createPositionNetworkChain($shifts);
        
        // Step 6: Generate comprehensive report
        $this->generateReport();
        
        $this->command->info("✅ Enhanced Marketplace Seeding Complete! Created {$swapCount} swap chains.");
    }
    
    /**
     * Load employees and group by position
     */
    private function loadEmployeesByPosition(): void
    {
        $this->command->info('📋 Loading employees by position...');
        
        // Get all employees with their positions
        $allEmployees = Employee::with(['user', 'position'])->get();
        
        foreach ($allEmployees as $employee) {
            $this->allEmployees[] = $employee;
            
            if (!$employee->position) continue;
            
            $positionTitle = strtolower($employee->position->title);
            
            if (str_contains($positionTitle, 'server') || str_contains($positionTitle, 'waiter')) {
                $this->servers[] = $employee;
            } elseif (str_contains($positionTitle, 'chef') || str_contains($positionTitle, 'cook')) {
                $this->chefs[] = $employee;
            } elseif (str_contains($positionTitle, 'bartender') || str_contains($positionTitle, 'bar')) {
                $this->bartenders[] = $employee;
            } elseif (str_contains($positionTitle, 'cashier') || str_contains($positionTitle, 'host')) {
                $this->cashiers[] = $employee;
            }
        }
        
        $this->command->info("   Servers: " . count($this->servers));
        $this->command->info("   Chefs: " . count($this->chefs));
        $this->command->info("   Bartenders: " . count($this->bartenders));
        $this->command->info("   Cashiers: " . count($this->cashiers));
    }
    
    /**
     * Categorize shifts by desirability and timing
     */
    private function categorizeShifts(): array
    {
        $this->command->info('📅 Categorizing shifts...');
        
        $now = now();
        
        $allShifts = Shift::with(['position', 'location'])
            ->where('date', '>=', $now->toDateString())
            ->where('date', '<=', $now->copy()->addWeeks(3)->toDateString())
            ->get();
        
        $categorized = [
            'all' => $allShifts,
            'emergency' => $allShifts->filter(fn($s) => Carbon::parse($s->date)->diffInHours($now) < 48),
            'thisWeek' => $allShifts->filter(fn($s) => Carbon::parse($s->date)->diffInDays($now) <= 7),
            'nextWeek' => $allShifts->filter(fn($s) => Carbon::parse($s->date)->diffInDays($now) > 7 && Carbon::parse($s->date)->diffInDays($now) <= 14),
            'farFuture' => $allShifts->filter(fn($s) => Carbon::parse($s->date)->diffInDays($now) > 14),
            'weekend' => $allShifts->filter(fn($s) => Carbon::parse($s->date)->isWeekend()),
            'weekday' => $allShifts->filter(fn($s) => !Carbon::parse($s->date)->isWeekend()),
        ];
        
        return $categorized;
    }
    
    /**
     * Create employee profiles for realistic behavior patterns
     */
    private function createEmployeeProfiles(array $shifts): array
    {
        $profiles = [];
        
        // Use servers primarily for most active profiles
        $availableServers = collect($this->servers);
        
        $profiles['busyServer'] = $availableServers->shift() ?? $this->allEmployees[0] ?? null;
        $profiles['extraHoursSeeker'] = $availableServers->shift() ?? $this->allEmployees[1] ?? null;
        $profiles['reducer'] = $availableServers->shift() ?? $this->allEmployees[2] ?? null;
        $profiles['emergencyResponder'] = $availableServers->shift() ?? $this->allEmployees[3] ?? null;
        $profiles['planner'] = $availableServers->shift() ?? $this->allEmployees[4] ?? null;
        $profiles['trader'] = $availableServers->shift() ?? $this->allEmployees[5] ?? null;
        
        return $profiles;
    }
    
    /**
     * Chain 1: The Busy Server - gives away 2 shifts, claims 1
     */
    private function createBusyServerChain($employee, array $shifts): int
    {
        if (!$employee) return 0;
        
        $this->command->info("   → Creating 'Busy Server' chain for {$employee->user->name}...");
        
        $count = 0;
        
        // Give away Friday shift (approved)
        if ($shifts['thisWeek']->count() > 0) {
            $fridayShift = $shifts['thisWeek']->first();
            $recipient = $this->findCompatibleEmployee($employee, $fridayShift);
            
            ShiftSwap::create([
                'requester_id' => $employee->id,
                'recipient_id' => $recipient?->id,
                'shift_id' => $fridayShift->id,
                'type' => 'give_away',
                'status' => 'approved',
                'reason' => 'Study for exam - thanks for covering!',
                'responded_at' => now()->subDays(3),
                'approved_by' => 1,
                'approved_at' => now()->subDays(2),
                'created_at' => now()->subDays(4),
            ]);
            $count++;
        }
        
        // Give away Saturday shift (pending)
        if ($shifts['weekend']->count() > 1) {
            $saturdayShift = $shifts['weekend']->skip(1)->first();
            
            ShiftSwap::create([
                'requester_id' => $employee->id,
                'shift_id' => $saturdayShift->id,
                'type' => 'give_away',
                'status' => 'pending',
                'reason' => 'Birthday celebration planned',
                'created_at' => now()->subHours(18),
            ]);
            $count++;
        }
        
        // Claims Sunday shift (showing they also take shifts)
        if ($shifts['weekend']->count() > 2) {
            $sundayShift = $shifts['weekend']->skip(2)->first();
            $originalRequester = $this->findCompatibleEmployee($employee, $sundayShift);
            
            if ($originalRequester && $originalRequester->id !== $employee->id) {
                ShiftSwap::create([
                    'requester_id' => $originalRequester->id,
                    'recipient_id' => $employee->id,
                    'shift_id' => $sundayShift->id,
                    'type' => 'give_away',
                    'status' => 'accepted_by_peer',
                    'reason' => 'Family commitment',
                    'responded_at' => now()->subHours(6),
                    'created_at' => now()->subDays(1),
                ]);
                $count++;
            }
        }
        
        return $count;
    }
    
    /**
     * Chain 2: The Extra Hours Seeker - claims multiple shifts
     */
    private function createExtraHoursSeekerChain($employee, array $shifts): int
    {
        if (!$employee) return 0;
        
        $this->command->info("   → Creating 'Extra Hours Seeker' chain for {$employee->user->name}...");
        
        $count = 0;
        
        // Claims 3 different shifts
        for ($i = 0; $i < 3 && $i < $shifts['thisWeek']->count(); $i++) {
            $shift = $shifts['thisWeek']->skip($i * 2)->first();
            if (!$shift) continue;
            
            $originalRequester = $this->findCompatibleEmployee($employee, $shift);
            if (!$originalRequester || $originalRequester->id === $employee->id) continue;
            
            $statuses = ['accepted_by_peer', 'approved', 'pending'];
            
            ShiftSwap::create([
                'requester_id' => $originalRequester->id,
                'recipient_id' => $i < 2 ? $employee->id : null,
                'shift_id' => $shift->id,
                'type' => 'give_away',
                'status' => $statuses[$i],
                'reason' => 'Need time off',
                'responded_at' => $i < 2 ? now()->subHours(($i + 1) * 12) : null,
                'approved_by' => $i === 1 ? 1 : null,
                'approved_at' => $i === 1 ? now()->subHours(6) : null,
                'created_at' => now()->subDays($i + 1),
            ]);
            $count++;
        }
        
        return $count;
    }
    
    /**
     * Chain 3: The Reducer - gives away multiple, claims none
     */
    private function createReducerChain($employee, array $shifts): int
    {
        if (!$employee) return 0;
        
        $this->command->info("   → Creating 'Reducer' chain for {$employee->user->name}...");
        
        $count = 0;
        $reasons = [
            'Reducing hours this month',
            'Focusing on studies',
            'Part-time schedule adjustment',
        ];
        
        for ($i = 0; $i < 3 && $i < $shifts['nextWeek']->count(); $i++) {
            $shift = $shifts['nextWeek']->skip($i * 2)->first();
            if (!$shift) continue;
            
            $recipient = $i === 0 ? $this->findCompatibleEmployee($employee, $shift) : null;
            
            ShiftSwap::create([
                'requester_id' => $employee->id,
                'recipient_id' => $recipient?->id,
                'shift_id' => $shift->id,
                'type' => 'give_away',
                'status' => $i === 0 ? 'approved' : 'pending',
                'reason' => $reasons[$i],
                'responded_at' => $i === 0 ? now()->subHours(24) : null,
                'approved_by' => $i === 0 ? 1 : null,
                'approved_at' => $i === 0 ? now()->subHours(12) : null,
                'created_at' => now()->subDays($i + 2),
            ]);
            $count++;
        }
        
        return $count;
    }
    
    /**
     * Chain 4: The Emergency Responder - last-minute swap
     */
    private function createEmergencyChain($employee, array $shifts): int
    {
        if (!$employee) return 0;
        
        $this->command->info("   → Creating 'Emergency' chain for {$employee->user->name}...");
        
        $count = 0;
        
        if ($shifts['emergency']->count() > 0) {
            $emergencyShift = $shifts['emergency']->first();
            $responder = $this->findCompatibleEmployee($employee, $emergencyShift);
            
            ShiftSwap::create([
                'requester_id' => $employee->id,
                'recipient_id' => $responder?->id,
                'shift_id' => $emergencyShift->id,
                'type' => 'give_away',
                'status' => $responder ? 'approved' : 'pending',
                'reason' => 'Family emergency - urgent coverage needed!',
                'responded_at' => $responder ? now()->subHours(2) : null,
                'approved_by' => $responder ? 1 : null,
                'approved_at' => $responder ? now()->subHours(1) : null,
                'created_at' => now()->subHours(6),
            ]);
            $count++;
        }
        
        return $count;
    }
    
    /**
     * Chain 5: The Planner - far-future swaps
     */
    private function createPlannerChain($employee, array $shifts): int
    {
        if (!$employee) return 0;
        
        $this->command->info("   → Creating 'Planner' chain for {$employee->user->name}...");
        
        $count = 0;
        
        if ($shifts['farFuture']->count() > 0) {
            $futureShift = $shifts['farFuture']->first();
            
            ShiftSwap::create([
                'requester_id' => $employee->id,
                'shift_id' => $futureShift->id,
                'type' => 'give_away',
                'status' => 'pending',
                'reason' => 'Vacation planned - booking in advance',
                'created_at' => now()->subDays(10),
            ]);
            $count++;
        }
        
        if ($shifts['farFuture']->count() > 1) {
            $futureShift2 = $shifts['farFuture']->skip(1)->first();
            
            ShiftSwap::create([
                'requester_id' => $employee->id,
                'shift_id' => $futureShift2->id,
                'type' => 'give_away',
                'status' => 'pending',
                'reason' => 'Conference attendance',
                'created_at' => now()->subDays(7),
            ]);
            $count++;
        }
        
        return $count;
    }
    
    /**
     * Chain 6: The Trader - prefers trades over give-aways
     */
    private function createTraderChain($employee, array $shifts): int
    {
        if (!$employee) return 0;
        
        $this->command->info("   → Creating 'Trader' chain for {$employee->user->name}...");
        
        $count = 0;
        
        // Trade weekday for weekend
        if ($shifts['weekday']->count() > 0) {
            $weekdayShift = $shifts['weekday']->first();
            
            ShiftSwap::create([
                'requester_id' => $employee->id,
                'shift_id' => $weekdayShift->id,
                'type' => 'trade',
                'status' => 'pending',
                'reason' => 'Looking to trade weekday for weekend shift',
                'created_at' => now()->subDays(3),
            ]);
            $count++;
        }
        
        // Trade morning for evening
        if ($shifts['thisWeek']->count() > 5) {
            $morningShift = $shifts['thisWeek']->skip(5)->first();
            
            ShiftSwap::create([
                'requester_id' => $employee->id,
                'shift_id' => $morningShift->id,
                'type' => 'trade',
                'status' => 'pending',
                'reason' => 'Prefer evening shifts - willing to trade',
                'created_at' => now()->subDays(2),
            ]);
            $count++;
        }
        
        return $count;
    }
    
    /**
     * Chain 7: Popular Shift with Competing Claims
     */
    private function createPopularShiftChain(array $shifts): int
    {
        $this->command->info("   → Creating 'Popular Shift' chain...");
        
        $count = 0;
        
        // Saturday night shift - everyone wants it!
        if ($shifts['weekend']->count() > 0) {
            $popularShift = $shifts['weekend']->first();
            $requester = $this->allEmployees[0] ?? null;
            $winner = $this->allEmployees[1] ?? null;
            
            if ($requester && $winner) {
                ShiftSwap::create([
                    'requester_id' => $requester->id,
                    'recipient_id' => $winner->id,
                    'shift_id' => $popularShift->id,
                    'type' => 'give_away',
                    'status' => 'accepted_by_peer',
                    'reason' => 'Concert tickets - great shift up for grabs!',
                    'responded_at' => now()->subHours(8),
                    'created_at' => now()->subDays(2),
                ]);
                $count++;
            }
        }
        
        return $count;
    }
    
    /**
     * Chain 8: Manager Approval Patterns
     */
    private function createManagerPatternChain(array $shifts): int
    {
        $this->command->info("   → Creating 'Manager Pattern' chain...");
        
        $count = 0;
        
        // Approved - planned ahead
        if ($shifts['nextWeek']->count() > 5) {
            $shift1 = $shifts['nextWeek']->skip(5)->first();
            $emp1 = $this->allEmployees[6] ?? null;
            $emp2 = $this->allEmployees[7] ?? null;
            
            if ($shift1 && $emp1 && $emp2) {
                ShiftSwap::create([
                    'requester_id' => $emp1->id,
                    'recipient_id' => $emp2->id,
                    'shift_id' => $shift1->id,
                    'type' => 'give_away',
                    'status' => 'approved',
                    'reason' => 'Doctor appointment - provided 2 weeks notice',
                    'responded_at' => now()->subDays(1),
                    'approved_by' => 1,
                    'approved_at' => now()->subHours(12),
                    'created_at' => now()->subDays(5),
                ]);
                $count++;
            }
        }
        
        // Denied - too last minute
        if ($shifts['emergency']->count() > 1) {
            $shift2 = $shifts['emergency']->skip(1)->first();
            $emp3 = $this->allEmployees[8] ?? null;
            
            if ($shift2 && $emp3) {
                ShiftSwap::create([
                    'requester_id' => $emp3->id,
                    'shift_id' => $shift2->id,
                    'type' => 'give_away',
                    'status' => 'denied',
                    'reason' => 'Last minute request - insufficient notice',
                    'responded_at' => now()->subHours(1),
                    'approved_by' => 1,
                    'approved_at' => now()->subHours(1),
                    'created_at' => now()->subHours(3),
                ]);
                $count++;
            }
        }
        
        // Cancelled - found alternative
        if ($shifts['thisWeek']->count() > 10) {
            $shift3 = $shifts['thisWeek']->skip(10)->first();
            $emp4 = $this->allEmployees[9] ?? null;
            
            if ($shift3 && $emp4) {
                ShiftSwap::create([
                    'requester_id' => $emp4->id,
                    'shift_id' => $shift3->id,
                    'type' => 'give_away',
                    'status' => 'cancelled',
                    'reason' => 'Issue resolved - found alternative arrangement',
                    'created_at' => now()->subDays(2),
                ]);
                $count++;
            }
        }
        
        return $count;
    }
    
    /**
     * Chain 9: Position-Based Networks
     */
    private function createPositionNetworkChain(array $shifts): int
    {
        $this->command->info("   → Creating 'Position Network' chain...");
        
        $count = 0;
        
        // Server network
        if (count($this->servers) >= 2 && $shifts['weekend']->count() > 3) {
            $serverShift = $shifts['weekend']->skip(3)->first();
            
            ShiftSwap::create([
                'requester_id' => $this->servers[0]->id,
                'recipient_id' => $this->servers[1]->id ?? null,
                'shift_id' => $serverShift->id,
                'type' => 'give_away',
                'status' => 'approved',
                'reason' => 'Server team helping each other out',
                'responded_at' => now()->subHours(20),
                'approved_by' => 1,
                'approved_at' => now()->subHours(18),
                'created_at' => now()->subDays(3),
            ]);
            $count++;
        }
        
        // Chef network
        if (count($this->chefs) >= 2 && $shifts['weekday']->count() > 3) {
            $chefShift = $shifts['weekday']->skip(3)->first();
            
            ShiftSwap::create([
                'requester_id' => $this->chefs[0]->id,
                'shift_id' => $chefShift->id,
                'type' => 'give_away',
                'status' => 'pending',
                'reason' => 'Kitchen staff coverage needed',
                'created_at' => now()->subHours(30),
            ]);
            $count++;
        }
        
        return $count;
    }
    
    /**
     * Find a compatible employee for shift swap
     */
    private function findCompatibleEmployee($excludeEmployee, $shift): ?Employee
    {
        // Try to find someone with the same position
        $compatibleEmployees = collect($this->allEmployees)
            ->filter(function($emp) use ($excludeEmployee, $shift) {
                if ($emp->id === $excludeEmployee->id) return false;
                if (!$emp->position || !$shift->position) return false;
                return $emp->position_id === $shift->position_id;
            });
        
        return $compatibleEmployees->random() ?? null;
    }
    
    /**
     * Generate comprehensive seeding report
     */
    private function generateReport(): void
    {
        $totalSwaps = ShiftSwap::count();
        $pendingSwaps = ShiftSwap::where('status', 'pending')->count();
        $acceptedSwaps = ShiftSwap::where('status', 'accepted_by_peer')->count();
        $approvedSwaps = ShiftSwap::where('status', 'approved')->count();
        $deniedSwaps = ShiftSwap::where('status', 'denied')->count();
        $cancelledSwaps = ShiftSwap::where('status', 'cancelled')->count();
        
        $giveAwayCount = ShiftSwap::where('type', 'give_away')->count();
        $tradeCount = ShiftSwap::where('type', 'trade')->count();
        
        $this->command->info("\n" . str_repeat('=', 60));
        $this->command->info("📊 ENHANCED MARKETPLACE SEEDING REPORT");
        $this->command->info(str_repeat('=', 60));
        
        $this->command->info("\n📈 Overall Statistics:");
        $this->command->info("   Total Swap Requests: {$totalSwaps}");
        $this->command->info("   Give-Aways: {$giveAwayCount}");
        $this->command->info("   Trades: {$tradeCount}");
        
        $this->command->info("\n🔄 Status Breakdown:");
        $this->command->info("   Pending (Available): {$pendingSwaps}");
        $this->command->info("   Accepted by Peer: {$acceptedSwaps}");
        $this->command->info("   Approved: {$approvedSwaps}");
        $this->command->info("   Denied: {$deniedSwaps}");
        $this->command->info("   Cancelled: {$cancelledSwaps}");
        
        $this->command->info("\n👥 Employee Activity:");
        $activeUsers = ShiftSwap::selectRaw('requester_id, COUNT(*) as count')
            ->groupBy('requester_id')
            ->orderByDesc('count')
            ->limit(3)
            ->with('requester.user')
            ->get();
        
        foreach ($activeUsers as $user) {
            $name = $user->requester->user->name ?? 'Unknown';
            $this->command->info("   {$name}: {$user->count} requests");
        }
        
        $this->command->info("\n🎯 Position Distribution:");
        $positionStats = ShiftSwap::with('shift.position')
            ->get()
            ->groupBy(fn($swap) => $swap->shift->position->title ?? 'Unknown')
            ->map(fn($group) => $group->count())
            ->sortDesc();
        
        foreach ($positionStats->take(3) as $position => $count) {
            $this->command->info("   {$position}: {$count} swaps");
        }
        
        $this->command->info("\n" . str_repeat('=', 60));
        $this->command->info("✅ Enhanced Marketplace is ready with realistic data chains!");
        $this->command->info(str_repeat('=', 60) . "\n");
    }
}

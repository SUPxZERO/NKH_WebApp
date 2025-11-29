<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class Sprint123Seeder extends Seeder
{
    /**
     * Run the database seeds for Sprint 1, 2, and 3
     */
    public function run(): void
    {
        $this->command->info('🌱 Starting Sprint 1-3 Database Seeding...');

        try {
            $this->seedLocations();
        } catch (\Exception $e) {
            $this->command->warn('⚠️  Locations seeding skipped: ' . $e->getMessage());
        }

        try {
            $this->seedPositions();
        } catch (\Exception $e) {
            $this->command->warn('⚠️  Positions seeding skipped: ' . $e->getMessage());
        }

        try {
            $this->seedUnits();
        } catch (\Exception $e) {
            $this->command->warn('⚠️  Units seeding skipped: ' . $e->getMessage());
        }

        try {
            $this->seedSuppliers();
        } catch (\Exception $e) {
            $this->command->warn('⚠️  Suppliers seeding skipped: ' . $e->getMessage());
        }

        try {
            $this->seedPurchaseOrders();
        } catch (\Exception $e) {
            $this->command->warn('⚠️  Purchase Orders seeding skipped: ' . $e->getMessage());
        }

        try {
            $this->seedRecipes();
        } catch (\Exception $e) {
            $this->command->warn('⚠️  Recipes seeding skipped: ' . $e->getMessage());
        }

        try {
            $this->seedShifts();
        } catch (\Exception $e) {
            $this->command->warn('⚠️  Shifts seeding skipped: ' . $e->getMessage());
        }

        try {
            $this->seedTimeOffRequests();
        } catch (\Exception $e) {
            $this->command->warn('⚠️  Time-off requests seeding skipped: ' . $e->getMessage());
        }

        $this->command->info('✅ Sprint 1-3 seeding completed!');
    }

    private function seedLocations(): void
    {
        $count = DB::table('locations')->count();
        if ($count > 0) {
            $this->command->info('  📍 Locations already seeded (' . $count . ')');
            return;
        }

        $locations = [
            [
                'code' => 'LOC-001',
                'name' => 'Main Branch - Downtown',
                'address' => '123 Main Street',
                'phone' => '+1-555-0101',
                'email' => 'downtown@nkh.com',
                'is_active' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'LOC-002',
                'name' => 'Westside Location',
                'address' => '456 West Avenue',
                'phone' => '+1-555-0201',
                'email' => 'westside@nkh.com',
                'is_active' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('locations')->insert($locations);
        $this->command->info('  📍 Locations seeded: ' . count($locations));
    }

    private function seedPositions(): void
    {
        $count = DB::table('positions')->count();
        if ($count > 0) {
            $this->command->info('  👔 Positions already seeded (' . $count . ')');
            return;
        }

        $positions = [
            ['code' => 'MGR', 'name' => 'Manager', 'hourly_rate' => 25.00, 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'CHF', 'name' => 'Head Chef', 'hourly_rate' => 22.00, 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'COOK', 'name' => 'Cook', 'hourly_rate' => 16.00, 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'WAIT', 'name' => 'Waiter', 'hourly_rate' => 12.00, 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
        ];

        DB::table('positions')->insert($positions);
        $this->command->info('  👔 Positions seeded: ' . count($positions));
    }

    private function seedUnits(): void
    {
        $count = DB::table('units')->count();
        if ($count > 0) {
            $this->command->info('  📏 Units already seeded (' . $count . ')');
            return;
        }

        $units = [
            ['code' => 'kg', 'name' => 'Kilogram', 'type' => 'weight', 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'L', 'name' => 'Liter', 'type' => 'volume', 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'pc', 'name' => 'Piece', 'type' => 'quantity', 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()],
        ];

        DB::table('units')->insert($units);
        $this->command->info('  📏 Units seeded: ' . count($units));
    }

    private function seedSuppliers(): void
    {
        $count = DB::table('suppliers')->count();
        if ($count > 0) {
            $this->command->info('  🚚 Suppliers already seeded (' . $count . ')');
            return;
        }

        $suppliers = [
            [
                'code' => 'SUP-001',
                'name' => 'Fresh Foods Co.',
                'email' => 'orders@freshfoods.com',
                'phone' => '+1-555-1000',
                'type' => 'food_produce',
                'is_active' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'SUP-002',
                'name' => 'Prime Meats Supply',
                'email' => 'sales@primemeats.com',
                'phone' => '+1-555-2000',
                'type' => 'meat_seafood',
                'is_active' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('suppliers')->insert($suppliers);
        $this->command->info('  🚚 Suppliers seeded: ' . count($suppliers));
    }

    private function seedPurchaseOrders(): void
    {
        $count = DB::table('purchase_orders')->count();
        if ($count > 0) {
            $this->command->info('  📦 Purchase Orders already seeded (' . $count . ')');
            return;
        }

        $this->command->info('  📦 Purchase Orders: Check if suppliers exist first');
    }

    private function seedRecipes(): void
    {
        $count = DB::table('recipes')->count();
        if ($count > 0) {
            $this->command->info('  👨‍🍳 Recipes already seeded (' . $count . ')');
            return;
        }

        $recipes = [
            [
                'name' => 'Classic Burger',
                'description' => 'Traditional beef burger',
                'servings' => 4,
                'is_active' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('recipes')->insert($recipes);
        $this->command->info('  👨‍🍳 Recipes seeded: ' . count($recipes));
    }

    private function seedShifts(): void
    {
        $count = DB::table('shifts')->count();
        if ($count > 0) {
            $this->command->info('  📅 Shifts already seeded (' . $count . ')');
            return;
        }

        $employeeIds = DB::table('employees')->pluck('id')->take(2)->toArray();
        
        if (empty($employeeIds)) {
            $this->command->warn('  ⚠️  No employees found. Skipping shifts.');
            return;
        }

        $today = Carbon::today();
        $shifts = [];

        foreach ($employeeIds as $employeeId) {
            $shifts[] = [
                'employee_id' => $employeeId,
                'start_time' => $today->copy()->setTime(9, 0),
                'end_time' => $today->copy()->setTime(17, 0),
                'shift_type' => 'morning',
                'status' => 'draft',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!empty($shifts)) {
            DB::table('shifts')->insert($shifts);
            $this->command->info('  📅 Shifts seeded: ' . count($shifts));
        }
    }

    private function seedTimeOffRequests(): void
    {
        $count = DB::table('time_off_requests')->count();
        if ($count > 0) {
            $this->command->info('  🌴 Time-off requests already seeded (' . $count . ')');
            return;
        }

        $employeeIds = DB::table('employees')->pluck('id')->take(2)->toArray();
        
        if (empty($employeeIds)) {
            $this->command->warn('  ⚠️  No employees found. Skipping time-off requests.');
            return;
        }

        $requests = [
            [
                'employee_id' => $employeeIds[0],
                'type' => 'vacation',
                'start_date' => Carbon::now()->addDays(14),
                'end_date' => Carbon::now()->addDays(18),
                'days_requested' => 5,
                'reason' => 'Family vacation',
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('time_off_requests')->insert($requests);
        $this->command->info('  🌴 Time-off requests seeded: ' . count($requests));
    }
}

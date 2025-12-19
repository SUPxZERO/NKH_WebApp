<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * MasterImprovedSeeder - Runs all improved seeders in correct order
 *
 * This seeds the database with improved, realistic data following proper relationships
 */
class MasterImprovedSeeder extends Seeder
{
    public function run(): void
    {
        // Disable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        $this->command->info('');
        $this->command->info('🍽️  ═══════════════════════════════════════════════════════════════');
        $this->command->info('🍽️  NKH Restaurant - Improved Database Seeder');
        $this->command->info('🍽️  ═══════════════════════════════════════════════════════════════');
        $this->command->info('');

        // PHASE 1: Foundation
        $this->command->info('📦 PHASE 1: Foundation...');
        $this->call([
            ComprehensiveRolesPermissionsSeeder::class,
            UnitSeeder::class,
        ]);

        // PHASE 2: Locations & Organization
        $this->command->info('🏢 PHASE 2: Locations & Organization...');
        $this->call([
            LocationSeeder::class,
            PositionSeeder::class,
            OperatingHoursSeeder::class,
        ]);

        // PHASE 3: Users
        $this->command->info('👥 PHASE 3: Users...');
        $this->call([
            UserSeeder::class,
        ]);

        // PHASE 4: Infrastructure
        $this->command->info('🏗️  PHASE 4: Restaurant Infrastructure...');
        $this->call([
            FloorSeeder::class,
            TableSeeder::class,
        ]);

        // PHASE 5: People Profiles
        $this->command->info('👤 PHASE 5: Customer & Employee Profiles...');
        $this->call([
            CustomerSeeder::class,
            EmployeeSeeder::class,
        ]);

        // PHASE 6: Menu System *** IMPROVED ***
        $this->command->info('🍽️  PHASE 6: Menu System (IMPROVED)...');
        $this->call([
            ImprovedCategorySeeder::class,  // ✅ Fixed category structure
            ImprovedMenuItemSeeder::class,  // ✅ Items only link to sub-categories
        ]);

        // PHASE 7: Inventory (if exists)
        $this->command->info('📦 PHASE 7: Inventory...');
        if (class_exists(\Database\Seeders\SupplierSeeder::class)) {
            $this->call([
                SupplierSeeder::class,
            ]);
        }
        if (class_exists(\Database\Seeders\IngredientSeeder::class)) {
            $this->call([
                IngredientSeeder::class,
            ]);
        }

        // PHASE 8: Payment Methods
        $this->command->info('💳 PHASE 8: Payment Methods...');
        if (class_exists(\Database\Seeders\PaymentMethodSeeder::class)) {
            $this->call([
                PaymentMethodSeeder::class,
            ]);
        }

        // PHASE 9: Orders (if exists)
        $this->command->info('🛒 PHASE 9: Orders...');
        if (class_exists(\Database\Seeders\OrderSeeder::class)) {
            $this->call([
                OrderSeeder::class,
            ]);
        }

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info('');
        $this->command->info('✅ ═══════════════════════════════════════════════════════════════');
        $this->command->info('✅  Database seeding completed successfully!');
        $this->command->info('✅ ═══════════════════════════════════════════════════════════════');
        $this->command->info('');

        // Final Statistics
        $this->displayStatistics();
    }

    private function displayStatistics(): void
    {
        $this->command->info('📊 DATABASE STATISTICS:');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        $stats = [
            'Users' => DB::table('users')->count(),
            'Roles' => DB::table('roles')->count(),
            'Permissions' => DB::table('permissions')->count(),
            'Locations' => DB::table('locations')->count(),
            'Main Categories' => DB::table('categories')->whereNull('parent_id')->count(),
            'Sub-Categories' => DB::table('categories')->whereNotNull('parent_id')->count(),
            'Menu Items' => DB::table('menu_items')->count(),
            'Employees' => DB::table('employees')->count(),
            'Customers' => DB::table('customers')->count(),
            'Orders' => DB::table('orders')->count(),
            'Floors' => DB::table('floors')->count(),
            'Tables' => DB::table('tables')->count(),
        ];

        foreach ($stats as $label => $count) {
            $this->command->info(sprintf('  %-20s: %d', $label, $count));
        }

        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Critical validation
        $invalid = DB::table('menu_items')
            ->join('categories', 'menu_items.category_id', '=', 'categories.id')
            ->whereNull('categories.parent_id')
            ->count();

        if ($invalid > 0) {
            $this->command->error("❌ CRITICAL: {$invalid} menu items linked to MAIN categories!");
        } else {
            $this->command->info('✅ VALIDATION: All menu items correctly linked to sub-categories!');
        }
    }
}

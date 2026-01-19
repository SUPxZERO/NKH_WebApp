<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\App;

// Reference Data (Static, Foundational)
use Database\Seeders\Ref\UnitSeeder;
use Database\Seeders\Ref\OrderStatusSeeder;
use Database\Seeders\Ref\OrderTypeSeeder;
use Database\Seeders\Ref\PaymentStatusSeeder;
use Database\Seeders\Ref\LoyaltyTierSeeder;
use Database\Seeders\Ref\RolePermissionSeeder;

// Production Candidates (Realistic Data)
use Database\Seeders\Prod\LocationSeeder;
use Database\Seeders\Prod\FloorSeeder;
use Database\Seeders\Prod\TableSeeder;
use Database\Seeders\Prod\PaymentMethodSeeder;
use Database\Seeders\Prod\SupplierSeeder;
use Database\Seeders\Prod\CategorySeeder;
use Database\Seeders\Prod\IngredientSeeder;
use Database\Seeders\Prod\InventorySeeder;
use Database\Seeders\Prod\MenuItemSeeder;
use Database\Seeders\Prod\UserSeeder;
use Database\Seeders\EmployeeSeeder;

// Demo/Operational Scenarios
use Database\Seeders\Demo\DayInLifeSeeder;
use Database\Seeders\ShiftSeeder;
use Database\Seeders\DemoUsersSeeder;
use Database\Seeders\CustomerSeeder;
use Database\Seeders\PromotionSeeder;
use Database\Seeders\ExpenseSeeder;
use Database\Seeders\DemoNotificationSeeder;
use Database\Seeders\InventoryTransactionSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Master Seeder for NKH Restaurant Management System
     * 
     * Strategy:
     * 1. Ref (Reference): Static lookup tables (Units, Statuses). Idempotent.
     * 2. Prod (Production): Realistic foundational data (Locations, Menus, Users). Idempotent.
     * 3. Demo (Simulation): Operational transactions for dev/testing.
     */
    public function run(): void
    {
        // Disable FK checks for smoother seeding
        $isPgsql = DB::getDriverName() === 'pgsql';
        if ($isPgsql) {
            DB::statement('SET CONSTRAINTS ALL DEFERRED;');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        }

        $this->command->info('');
        $this->command->info('🌱 NKH Seeder Strategy: Initializing...');
        $this->command->info('');

        // ---------------------------------------------------------
        // 1. REFERENCE DATA (Ref)
        // ---------------------------------------------------------
        $this->command->info('📦 Seeding Reference Data (Ref)...');
        $this->call([
            UnitSeeder::class,
            OrderStatusSeeder::class,
            OrderTypeSeeder::class,
            PaymentStatusSeeder::class,
            LoyaltyTierSeeder::class,
            RolePermissionSeeder::class,
        ]);
        $this->command->info('   ✅ Reference data secured.');
        $this->command->info('');

        // ---------------------------------------------------------
        // 2. PRODUCTION DATA (Prod)
        // ---------------------------------------------------------
        $this->command->info('🏢 Seeding Production Environment (Prod)...');
        $this->call([
            LocationSeeder::class,
            FloorSeeder::class,
            TableSeeder::class,
            PaymentMethodSeeder::class,
            SupplierSeeder::class,
            CategorySeeder::class,
            IngredientSeeder::class,
            InventorySeeder::class,
            MenuItemSeeder::class,
            \Database\Seeders\Prod\RecipeSeeder::class,
            UserSeeder::class,
            EmployeeSeeder::class, // Staff & Positions
            \Database\Seeders\Prod\PurchaseOrderSeeder::class,
            \Database\Seeders\Prod\InventoryAdjustmentSeeder::class,
            \Database\Seeders\InventoryTransactionSeeder::class, // Added for Daily Usage report
        ]);
        $this->command->info('   ✅ Environment established.');
        $this->command->info('');

        // ---------------------------------------------------------
        // 3. DEMO SCENARIOS (Demo)
        //Only run in local/staging, or if explicitly requested needed
        // ---------------------------------------------------------
        if (App::environment(['local', 'staging', 'testing', 'development'])) {
            $this->command->info('🎬 Running Operational Scenarios (Demo)...');
            $this->call([
                DemoUsersSeeder::class,        // Sample users (admin, customer, employee)
                CustomerSeeder::class,          // Customer profiles with preferences
                ShiftSeeder::class,             // Employee shift schedules
                PromotionSeeder::class,         // Marketing promotions
                ExpenseSeeder::class,           // Operational expenses
                DemoNotificationSeeder::class,  // System notifications
                DayInLifeSeeder::class,         // Orders, Reservations, Invoices, Payments
            ]);
            $this->command->info('   ✅ Scenarios executed.');
        } else {
            $this->command->info('⏩ Skipping Demo data (Production environment detected).');
        }

        // Re-enable FK checks
        if ($isPgsql) {
            DB::statement('SET CONSTRAINTS ALL IMMEDIATE;');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        }

        $this->command->info('');
        $this->command->info('🚀 Database Seeding Completed Successfully!');
        $this->command->info('   Ready for action.');
        $this->command->info('');
    }
}

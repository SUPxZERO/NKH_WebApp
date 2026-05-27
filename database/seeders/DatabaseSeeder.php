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
        // 3. DEEP WORKFLOW SCENARIOS (Demo & Edge Cases)
        // ---------------------------------------------------------
        if (App::environment(['local', 'staging', 'testing', 'development'])) {
            $this->command->info('🎬 Orchestrating Deep Workflow Demo Data...');
            
            $workflowSeeders = [
                'Core Users' => [
                    DemoUsersSeeder::class,
                    CustomerSeeder::class,
                ],
                'HR & Staffing' => [
                    ShiftSeeder::class,
                    \Database\Seeders\TimeOffRequestSeeder::class,
                    \Database\Seeders\LeaveRequestSeeder::class,
                    \Database\Seeders\DecemberAttendanceSeeder::class,
                    \Database\Seeders\ShiftMarketplaceSeeder::class,
                ],
                'Logistics & Delivery' => [
                    \Database\Seeders\DeliveryOrdersSeeder::class,
                    \Database\Seeders\DriverOrderTestSeeder::class,
                ],
                'Kitchen & Inventory Alerts' => [
                    \Database\Seeders\StockAlertSeeder::class,
                ],
                'Marketing & FOH' => [
                    PromotionSeeder::class,
                    \Database\Seeders\LoyaltyPointsSeeder::class,
                    \Database\Seeders\FeaturedMenuItemsSeeder::class,
                ],
                'Finance & Transactions' => [
                    ExpenseSeeder::class,
                    \Database\Seeders\InvoiceSeeder::class,
                    \Database\Seeders\PaymentSeeder::class,
                ],
                'Oversight & Audit' => [
                    DemoNotificationSeeder::class,
                    \Database\Seeders\AuditLogSeeder::class,
                ],
                'Capstone: Realistic Day Simulation' => [
                    \Database\Seeders\Demo\DayInLifeSeeder::class,
                ],
                'Gap Coverage: All Remaining Tables' => [
                    \Database\Seeders\Demo\WorkflowDataSeeder::class,
                ]
            ];

            foreach ($workflowSeeders as $domain => $seeders) {
                $this->command->info("   -> Populating Domain: $domain");
                foreach ($seeders as $seeder) {
                    try {
                        $this->call($seeder);
                    } catch (\Throwable $e) {
                        $this->command->warn("      ⚠️ Skipped $seeder: " . $e->getMessage());
                    }
                }
            }
            $this->command->info('   ✅ Deep Workflows fully initialized.');
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

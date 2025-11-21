<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with comprehensive restaurant data.
     */
    public function run(): void
    {
        // Disable foreign key checks for seeding
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        $this->command->info('🚀 Starting comprehensive NKH Restaurant database seeding...');

        $this->call([
            // Phase 1: Core System Setup
            RoleSeeder::class,
            RolesAndPermissionsSeeder::class,
            UnitSeeder::class,
            LocationSeeder::class,
            PositionSeeder::class,
            UserSeeder::class,
            CustomerAddressesSeeder::class,
            
            // Phase 2: Restaurant Configuration
            CategorySeeder::class,
            
            // Phase 3: Inventory Management
            IngredientSeeder::class,
            SupplierSeeder::class,
            
            // Phase 4: Menu Management
            MenuItemSeeder::class,
            MenuItemTranslationSeeder::class,
            RecipeSeeder::class,
            
            // Phase 4: Restaurant Operations 
            FloorSeeder::class,
            TableSeeder::class,
            EmployeeSeeder::class,
            CustomerSeeder::class,
            LeaveRequestSeeder::class,
            
            // Phase 5: Business Transactions
            PaymentMethodSeeder::class,
            OrderSeeder::class,
            OrderItemSeeder::class,
            InvoiceSeeder::class,
            PaymentSeeder::class,
            LoyaltyPointTransactionSeeder::class,
            
            // Phase 6: Advanced Operations
            ReservationSeeder::class,
            InventoryTransactionSeeder::class,
            ExpenseCategorySeeder::class,
            ExpenseSeeder::class,
            LoyaltyPointsSeeder::class,
            AuditLogSeeder::class,
            PromotionSeeder::class,
        ]);

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info('✅ Database seeding completed successfully!');
        $this->command->info('📊 Your NKH Restaurant Management System is now populated with realistic data.');
        $this->command->info('🎉 Ready for production demonstration!');
    }
}

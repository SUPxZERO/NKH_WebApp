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
            // Phase 1: Foundation Data
            LocationSeeder::class,
            PositionSeeder::class,
            UserSeeder::class,
            
            // Phase 2: Menu System
            CategorySeeder::class,
            CategoryTranslationSeeder::class,
            MenuItemSeeder::class,
            MenuItemTranslationSeeder::class,
            IngredientSeeder::class,
            
            // Phase 3: Restaurant Operations
            FloorSeeder::class,
            TableSeeder::class,
            EmployeeSeeder::class,
            CustomerSeeder::class,
            
            // Phase 4: Business Data
            PaymentMethodSeeder::class,
            OrderSeeder::class,
            OrderItemSeeder::class,
            InvoiceSeeder::class,
            PaymentSeeder::class,
            
            // Phase 5: Advanced Features
            ReservationSeeder::class,
            ExpenseCategorySeeder::class,
            ExpenseSeeder::class,
            LoyaltyPointSeeder::class,
            PromotionSeeder::class,
            
            // Phase 6: System & Audit
            FeedbackSeeder::class,
            AuditLogSeeder::class,
            AttendanceSeeder::class,
            LeaveRequestSeeder::class,
            InventoryTransactionSeeder::class,
            
            // Legacy seeders (if needed)
            DefaultLocationSeeder::class,
            RolesAndPermissionsSeeder::class,
            PaymentMethodsSeeder::class,
            OperatingHoursSeeder::class,
            OrderTimeSlotsSeeder::class,
            CustomerAddressesSeeder::class,
        ]);

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info('✅ Database seeding completed successfully!');
        $this->command->info('📊 Your NKH Restaurant Management System is now populated with realistic data.');
        $this->command->info('🎉 Ready for production demonstration!');
    }
}

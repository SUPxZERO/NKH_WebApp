<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * DatabaseSeeder - Master seeder for NKH Restaurant Management System
 * 
 * This seeder is organized based on a deep analysis of the database schema
 * and foreign key relationships. Tables are seeded in dependency order
 * to ensure referential integrity.
 * 
 * DEPENDENCY HIERARCHY:
 * =====================
 * Level 0: Base tables with no foreign key dependencies
 * Level 1: Tables that depend only on Level 0 tables
 * Level 2: Tables that depend on Level 0-1 tables
 * Level 3: Tables that depend on Level 0-2 tables
 * Level 4: Tables that depend on Level 0-3 tables
 * Level 5: Tables that depend on Level 0-4 tables
 * Level 6: Tables that depend on Level 0-5 tables
 * 
 * KEY RELATIONSHIPS:
 * - users -> locations (default_location_id)
 * - customers -> users (user_id), locations (preferred_location_id)
 * - employees -> users (user_id), positions, locations
 * - menu_items -> locations, categories
 * - orders -> locations, tables, customers, employees, promotions
 * - order_items -> orders, menu_items
 * - invoices -> orders, locations
 * - payments -> invoices, payment_methods
 * - recipes -> menu_items
 * - recipe_ingredients -> recipes, ingredients
 * - inventory -> ingredients, locations
 * - reservations -> locations, customers, tables
 */
class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with comprehensive restaurant data.
     */
    public function run(): void
    {
        // Disable foreign key checks for seeding (allows for flexible insertion order)
        // PostgreSQL uses different syntax than MySQL
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('SET CONSTRAINTS ALL DEFERRED;');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        }

        $this->command->info('');
        $this->command->info('🍽️  ═══════════════════════════════════════════════════════════════');
        $this->command->info('🍽️  NKH Restaurant Management System - Database Seeder');
        $this->command->info('🍽️  ═══════════════════════════════════════════════════════════════');
        $this->command->info('');

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 0: FOUNDATION - Base reference tables with NO dependencies
        // ══════════════════════════════════════════════════════════════════════
        $this->command->info('📦 PHASE 0: Seeding foundation tables...');
        $this->call([
            ComprehensiveRolesPermissionsSeeder::class,  // NEW: Comprehensive roles & permissions with multi-role support
            UnitSeeder::class,                           // units table (measurement units)
            OrderTypeSeeder::class,                      // order_types lookup
            OrderStatusSeeder::class,                    // order_statuses lookup
            PaymentStatusSeeder::class,                  // payment_statuses lookup
            LoyaltyTierSeeder::class,                    // loyalty_tiers lookup
        ]);
        $this->command->info('✅ Foundation tables seeded.');
        $this->command->info('');

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 1: LOCATIONS & POSITIONS - Core organizational structure
        // Dependencies: None (or roles for operational context)
        // ══════════════════════════════════════════════════════════════════════
        $this->command->info('🏢 PHASE 1: Seeding locations and organizational structure...');
        $this->call([
            LocationSeeder::class,                // locations table (restaurant branches)
            PositionSeeder::class,                // positions table (job titles)
            OperatingHoursSeeder::class,          // operating_hours -> locations
        ]);
        $this->command->info('✅ Locations and positions seeded.');
        $this->command->info('');

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 2: USERS & ACCOUNTS - All user types (admin, employee, customer)
        // Dependencies: locations, roles
        // ══════════════════════════════════════════════════════════════════════
        $this->command->info('👥 PHASE 2: Seeding user accounts...');
        $this->call([
            UserSeeder::class,                    // users -> locations; role_user pivot
        ]);
        $this->command->info('✅ User accounts seeded.');
        $this->command->info('');

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 3: RESTAURANT INFRASTRUCTURE - Physical layout and amenities
        // Dependencies: locations
        // ══════════════════════════════════════════════════════════════════════
        $this->command->info('🏗️  PHASE 3: Seeding restaurant infrastructure...');
        $this->call([
            FloorSeeder::class,                   // floors -> locations
            TableSeeder::class,                   // tables -> floors
        ]);
        $this->command->info('✅ Restaurant infrastructure seeded.');
        $this->command->info('');

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 4: PEOPLE PROFILES - Customers and Employees with full details
        // Dependencies: users, locations, positions
        // ══════════════════════════════════════════════════════════════════════
        $this->command->info('👤 PHASE 4: Seeding customer and employee profiles...');
        $this->call([
            CustomerSeeder::class,                // customers -> users, locations
            CustomerAddressesSeeder::class,       // customer_addresses -> customers
            EmployeeSeeder::class,                // employees -> users, positions, locations
            LeaveRequestSeeder::class,            // leave_requests -> employees, locations
            TelegramUserSeeder::class,            // telegram_users
        ]);
        $this->command->info('✅ Customer and employee profiles seeded.');
        $this->command->info('');

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 5: MENU MANAGEMENT - Categories and menu items
        // Dependencies: locations
        // ══════════════════════════════════════════════════════════════════════
        $this->command->info('🍔 PHASE 5: Seeding menu categories and items...');
        $this->call([
            ImprovedCategorySeeder::class,        // IMPROVED: categories -> locations (parent_id self-ref)
            ImprovedMenuItemSeeder::class,        // IMPROVED: menu_items ONLY link to sub-categories
        ]);
        $this->command->info('✅ Menu categories and items seeded.');
        $this->command->info('');

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 6: INVENTORY MANAGEMENT - Ingredients, stock, and suppliers
        // Dependencies: units, suppliers, locations
        // ══════════════════════════════════════════════════════════════════════
        $this->command->info('📦 PHASE 6: Seeding inventory management...');
        $this->call([
            SupplierSeeder::class,                // suppliers -> locations
            IngredientSeeder::class,              // ingredients -> units, suppliers
            InventorySeeder::class,               // inventory -> ingredients, locations
            InventoryAdjustmentSeeder::class,     // inventory_adjustments -> ingredients, locations, users
            StockAlertSeeder::class,              // stock_alerts -> ingredients, locations, users
        ]);
        $this->command->info('✅ Inventory management seeded.');
        $this->command->info('');

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 7: RECIPES - Linking menu items to ingredients
        // Dependencies: menu_items, ingredients
        // ══════════════════════════════════════════════════════════════════════
        $this->command->info('📝 PHASE 7: Seeding recipes...');
        $this->call([
            RecipeSeeder::class,                  // recipes -> menu_items; recipe_ingredients -> recipes, ingredients
        ]);
        $this->command->info('✅ Recipes seeded.');
        $this->command->info('');

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 8: PROMOTIONS - Discount codes and special offers
        // Dependencies: locations
        // ══════════════════════════════════════════════════════════════════════
        $this->command->info('🎁 PHASE 8: Seeding promotions...');
        $this->call([
            PromotionSeeder::class,               // promotions -> locations
        ]);
        $this->command->info('✅ Promotions seeded.');
        $this->command->info('');

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 9: PAYMENT CONFIGURATION - Payment methods setup
        // Dependencies: None
        // ══════════════════════════════════════════════════════════════════════
        $this->command->info('💳 PHASE 9: Seeding payment methods...');
        $this->call([
            PaymentMethodSeeder::class,           // payment_methods (no FK dependencies)
        ]);
        $this->command->info('✅ Payment methods seeded.');
        $this->command->info('');

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 10: ORDERS - The core business transactions
        // Dependencies: locations, tables, customers, employees, promotions, 
        //               customer_addresses, order_time_slots
        // ══════════════════════════════════════════════════════════════════════
        $this->command->info('🧾 PHASE 10: Seeding orders...');
        $this->call([
            OrderSeeder::class,                   // orders -> locations, tables, customers, employees, promotions
            OrderItemSeeder::class,               // order_items -> orders, menu_items
        ]);
        $this->command->info('✅ Orders seeded.');
        $this->command->info('');

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 11: INVOICES & PAYMENTS - Financial transactions
        // Dependencies: orders, locations, payment_methods
        // ══════════════════════════════════════════════════════════════════════
        $this->command->info('💰 PHASE 11: Seeding invoices and payments...');
        $this->call([
            InvoiceSeeder::class,                 // invoices -> orders, locations
            PaymentSeeder::class,                 // payments -> invoices, payment_methods
        ]);
        $this->command->info('✅ Invoices and payments seeded.');
        $this->command->info('');

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 12: LOYALTY PROGRAM - Customer rewards and points
        // Dependencies: customers, orders, locations
        // ══════════════════════════════════════════════════════════════════════
        $this->command->info('⭐ PHASE 12: Seeding loyalty points...');
        $this->call([
            LoyaltyPointTransactionSeeder::class, // loyalty_points -> customers, orders, locations
            LoyaltyPointsSeeder::class,           // Updates customer loyalty_points balance
        ]);
        $this->command->info('✅ Loyalty points seeded.');
        $this->command->info('');

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 13: INVENTORY TRANSACTIONS - Stock movement records
        // Dependencies: ingredients, locations, users, order_items
        // ══════════════════════════════════════════════════════════════════════
        $this->command->info('📊 PHASE 13: Seeding inventory transactions...');
        $this->call([
            InventoryTransactionSeeder::class,    // inventory_transactions -> ingredients, locations, users, order_items
        ]);
        $this->command->info('✅ Inventory transactions seeded.');
        $this->command->info('');

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 14: RESERVATIONS - Table bookings
        // Dependencies: locations, customers, tables
        // ══════════════════════════════════════════════════════════════════════
        $this->command->info('📅 PHASE 14: Seeding reservations...');
        $this->call([
            ReservationSeeder::class,             // reservations -> locations, customers, tables
        ]);
        $this->command->info('✅ Reservations seeded.');
        $this->command->info('');

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 15: EXPENSES - Operational costs tracking
        // Dependencies: locations, expense_categories, users
        // ══════════════════════════════════════════════════════════════════════
        $this->command->info('💸 PHASE 15: Seeding expenses...');
        $this->call([
            ExpenseCategorySeeder::class,         // expense_categories -> locations
            ExpenseSeeder::class,                 // expenses -> locations, expense_categories, users
        ]);
        $this->command->info('✅ Expenses seeded.');
        $this->command->info('');

        // ══════════════════════════════════════════════════════════════════════
        // PHASE 16: AUDIT LOGS - System activity tracking
        // Dependencies: users
        // ══════════════════════════════════════════════════════════════════════
        $this->command->info('📋 PHASE 16: Seeding audit logs...');
        $this->call([
            AuditLogSeeder::class,                // audit_logs -> users
        ]);
        $this->command->info('✅ Audit logs seeded.');
        $this->command->info('');

        // Re-enable foreign key checks
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('SET CONSTRAINTS ALL IMMEDIATE;');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        }

        $this->command->info('');
        $this->command->info('═══════════════════════════════════════════════════════════════════');
        $this->command->info('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
        $this->command->info('═══════════════════════════════════════════════════════════════════');
        $this->command->info('');
        $this->command->info('📊 Summary of seeded data:');
        $this->command->info('   • Roles and Permissions configured');
        $this->command->info('   • Locations with operating hours');
        $this->command->info('   • User accounts (Admin, Manager, Employee, Customer)');
        $this->command->info('   • Restaurant floors and tables');
        $this->command->info('   • Customer profiles with addresses');
        $this->command->info('   • Employee records with positions');
        $this->command->info('   • Menu categories and items with translations');
        $this->command->info('   • Ingredients and inventory');
        $this->command->info('   • Recipes with ingredient links');
        $this->command->info('   • Orders with items, invoices, and payments');
        $this->command->info('   • Loyalty points and transactions');
        $this->command->info('   • Reservations');
        $this->command->info('   • Expenses and categories');
        $this->command->info('   • Audit logs');
        $this->command->info('');
        $this->command->info('🎉 Your NKH Restaurant Management System is ready for use!');
        $this->command->info('');
        $this->command->info('📌 Default login credentials:');
        $this->command->info('   Admin:    demo@admin.com / demo123');
        $this->command->info('   Employee: demo@employee.com / demo123');
        $this->command->info('   Customer: demo@customer.com / demo123');
        $this->command->info('');
    }
}

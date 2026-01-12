<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Sprint 1: Scalability Foundation - Add Missing Performance Indexes
     */
    public function up(): void
    {
        // Customers: Email and phone lookups (VERIFIED - these columns exist)
        if (!$this->indexExists('customers', 'idx_customers_email')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->index(['email'], 'idx_customers_email');
            });
        }
        
        if (!$this->indexExists('customers', 'idx_customers_phone')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->index(['phone'], 'idx_customers_phone');
            });
        }

        // Employees: Status-based queries (VERIFIED)
        if (!$this->indexExists('employees', 'idx_employees_location_status')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->index(['location_id', 'status'], 'idx_employees_location_status');
            });
        }

        // Note: Other indexes commented out pending schema verification
        // TODO: Verify column names for: menu_items, reservations, inventory, telegram_users, user_notifications
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex('idx_customers_email');
            $table->dropIndex('idx_customers_phone');
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->dropIndex('idx_employees_location_status');
        });
    }

    /**
     * Check if an index exists on a table (Laravel 11 compatible)
     */
    private function indexExists(string $table, string $indexName): bool
    {
        $database = Schema::getConnection()->getDatabaseName();
        
        $result = Schema::getConnection()->selectOne(
            "SELECT COUNT(*) as count
             FROM information_schema.statistics
             WHERE table_schema = ?
             AND table_name = ?
             AND index_name = ?",
            [$database, $table, $indexName]
        );
        
        return $result && $result->count > 0;
    }
};

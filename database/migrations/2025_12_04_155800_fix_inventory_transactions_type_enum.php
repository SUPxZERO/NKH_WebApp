<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Fix inventory_transactions.type column - change from ENUM to VARCHAR
     * to support all transaction types (transfer_in, transfer_out, wastage, adjustment, etc.)
     */
    public function up(): void
    {
        // MySQL requires ALTER to change ENUM to VARCHAR
        // First, let's change the column type from ENUM to VARCHAR(50)
        DB::statement("ALTER TABLE inventory_transactions MODIFY COLUMN type VARCHAR(50) NULL");
        
        // Map old values to new values for consistency
        DB::statement("UPDATE inventory_transactions SET type = 'stock_in' WHERE type = 'in'");
        DB::statement("UPDATE inventory_transactions SET type = 'stock_out' WHERE type = 'out'");
        DB::statement("UPDATE inventory_transactions SET type = 'adjustment' WHERE type = 'adjust'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We won't reverse this as it could cause data loss
    }
};

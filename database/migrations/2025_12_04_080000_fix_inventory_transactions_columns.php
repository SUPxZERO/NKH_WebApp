<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Fix inventory_transactions table to have correct column names
     * The model uses 'type' and 'created_by' but the original migration had 'movement_type' and 'user_id'
     */
    public function up(): void
    {
        // Check if we need to add the 'type' column (model expects this)
        if (!Schema::hasColumn('inventory_transactions', 'type')) {
            Schema::table('inventory_transactions', function (Blueprint $table) {
                $table->string('type', 30)->nullable()->after('location_id');
            });
            
            // Copy data from movement_type to type if movement_type exists
            if (Schema::hasColumn('inventory_transactions', 'movement_type')) {
                DB::statement('UPDATE inventory_transactions SET type = movement_type WHERE type IS NULL');
            }
        }
        
        // Check if we need to add the 'created_by' column (model expects this)
        if (!Schema::hasColumn('inventory_transactions', 'created_by')) {
            Schema::table('inventory_transactions', function (Blueprint $table) {
                $table->unsignedBigInteger('created_by')->nullable()->after('transacted_at');
            });
            
            // Copy data from user_id to created_by if user_id exists
            if (Schema::hasColumn('inventory_transactions', 'user_id')) {
                DB::statement('UPDATE inventory_transactions SET created_by = user_id WHERE created_by IS NULL');
            }
        }
        
        // Add other columns the model expects that might be missing
        if (!Schema::hasColumn('inventory_transactions', 'unit_cost')) {
            Schema::table('inventory_transactions', function (Blueprint $table) {
                $table->decimal('unit_cost', 10, 2)->nullable()->after('quantity');
            });
        }
        
        if (!Schema::hasColumn('inventory_transactions', 'value')) {
            Schema::table('inventory_transactions', function (Blueprint $table) {
                $table->decimal('value', 12, 2)->nullable()->after('unit_cost');
            });
        }
        
        if (!Schema::hasColumn('inventory_transactions', 'order_item_id')) {
            Schema::table('inventory_transactions', function (Blueprint $table) {
                $table->unsignedBigInteger('order_item_id')->nullable()->after('created_by');
            });
        }
        
        if (!Schema::hasColumn('inventory_transactions', 'sourceable_type')) {
            Schema::table('inventory_transactions', function (Blueprint $table) {
                $table->string('sourceable_type')->nullable()->after('value');
                $table->unsignedBigInteger('sourceable_id')->nullable()->after('sourceable_type');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_transactions', function (Blueprint $table) {
            // Drop the columns we added (be careful with existing data)
            $columns = ['type', 'created_by', 'unit_cost', 'value', 'order_item_id', 'sourceable_type', 'sourceable_id'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('inventory_transactions', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

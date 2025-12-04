<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Comprehensive fix for all remaining admin page issues
     */
    public function up(): void
    {
        // 1. Fix expenses table - add missing columns and make location_id nullable
        Schema::table('expenses', function (Blueprint $table) {
            if (!Schema::hasColumn('expenses', 'location_id')) {
                $table->unsignedBigInteger('location_id')->nullable()->after('id');
            }
            if (!Schema::hasColumn('expenses', 'expense_category_id')) {
                $table->unsignedBigInteger('expense_category_id')->nullable()->after('location_id');
            }
            if (!Schema::hasColumn('expenses', 'created_by')) {
                $table->unsignedBigInteger('created_by')->nullable()->after('expense_category_id');
            }
            if (!Schema::hasColumn('expenses', 'expense_date')) {
                $table->date('expense_date')->nullable()->after('created_by');
            }
            if (!Schema::hasColumn('expenses', 'amount')) {
                $table->decimal('amount', 12, 2)->default(0)->after('expense_date');
            }
            if (!Schema::hasColumn('expenses', 'currency')) {
                $table->string('currency', 10)->default('USD')->after('amount');
            }
            if (!Schema::hasColumn('expenses', 'vendor_name')) {
                $table->string('vendor_name', 200)->nullable()->after('currency');
            }
            if (!Schema::hasColumn('expenses', 'reference')) {
                $table->string('reference', 200)->nullable()->after('vendor_name');
            }
            if (!Schema::hasColumn('expenses', 'description')) {
                $table->text('description')->nullable()->after('reference');
            }
            if (!Schema::hasColumn('expenses', 'attachment_path')) {
                $table->string('attachment_path')->nullable()->after('description');
            }
            if (!Schema::hasColumn('expenses', 'status')) {
                $table->string('status', 20)->default('approved')->after('attachment_path');
            }
        });

        // 2. Make location_id nullable in expenses if it exists but is NOT NULL
        try {
            \DB::statement('ALTER TABLE expenses MODIFY location_id BIGINT UNSIGNED NULL');
        } catch (\Exception $e) {
            // Column might not exist or already nullable
        }

        // 3. Make location_id nullable in loyalty_points if it exists but is NOT NULL  
        try {
            \DB::statement('ALTER TABLE loyalty_points MODIFY location_id BIGINT UNSIGNED NULL');
        } catch (\Exception $e) {
            // Column might not exist or already nullable
        }

        // 4. Fix inventory_adjustments - ensure status-related columns exist
        if (Schema::hasTable('inventory_adjustments')) {
            Schema::table('inventory_adjustments', function (Blueprint $table) {
                if (!Schema::hasColumn('inventory_adjustments', 'status')) {
                    $table->string('status', 20)->default('pending')->after('id');
                }
                if (!Schema::hasColumn('inventory_adjustments', 'approved_at')) {
                    $table->timestamp('approved_at')->nullable()->after('status');
                }
                if (!Schema::hasColumn('inventory_adjustments', 'approved_by')) {
                    $table->unsignedBigInteger('approved_by')->nullable()->after('approved_at');
                }
                if (!Schema::hasColumn('inventory_adjustments', 'rejected_at')) {
                    $table->timestamp('rejected_at')->nullable()->after('approved_by');
                }
                if (!Schema::hasColumn('inventory_adjustments', 'rejected_by')) {
                    $table->unsignedBigInteger('rejected_by')->nullable()->after('rejected_at');
                }
                if (!Schema::hasColumn('inventory_adjustments', 'rejection_reason')) {
                    $table->text('rejection_reason')->nullable()->after('rejected_by');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Not reversing these changes as they are fixes
    }
};

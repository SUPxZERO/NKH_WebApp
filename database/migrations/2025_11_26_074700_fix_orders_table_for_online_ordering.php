<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration fixes all issues with the orders table for online ordering:
     * 1. Adds missing delivery_fee column
     * 2. Adds pickup_time column
     * 3. Adds delivery_instructions column
     * 4. Renames inconsistent columns to match Order model
     * 5. Adds missing indexes for performance
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Add delivery fee column (critical for delivery orders)
            if (!Schema::hasColumn('orders', 'delivery_fee')) {
                $table->decimal('delivery_fee', 12, 2)->default(0)->after('service_charge');
            }

            // Add pickup time for pickup orders
            if (!Schema::hasColumn('orders', 'pickup_time')) {
                $table->timestamp('pickup_time')->nullable()->after('scheduled_at');
            }

            // Add delivery instructions
            if (!Schema::hasColumn('orders', 'delivery_instructions')) {
                $table->text('delivery_instructions')->nullable()->after('special_instructions');
            }

            // Add time_slot_id if missing
            if (!Schema::hasColumn('orders', 'time_slot_id')) {
                $table->foreignId('time_slot_id')->nullable()
                    ->constrained('order_time_slots')->nullOnDelete()->cascadeOnUpdate()->after('customer_address_id');
            }
        });

        // Fix column name inconsistencies by renaming
        $driver = Schema::getConnection()->getDriverName();
        
        try {
            // Rename 'type' to 'order_type' if it exists and order_type doesn't
            if (Schema::hasColumn('orders', 'type') && !Schema::hasColumn('orders', 'order_type')) {
                Schema::table('orders', function (Blueprint $table) {
                    $table->renameColumn('type', 'order_type');
                });
            }

            // Rename financial columns to match model
            if (Schema::hasColumn('orders', 'total') && !Schema::hasColumn('orders', 'total_amount')) {
                Schema::table('orders', function (Blueprint $table) {
                    $table->renameColumn('total', 'total_amount');
                });
            }

            if (Schema::hasColumn('orders', 'tax_total') && !Schema::hasColumn('orders', 'tax_amount')) {
                Schema::table('orders', function (Blueprint $table) {
                    $table->renameColumn('tax_total', 'tax_amount');
                });
            }

            if (Schema::hasColumn('orders', 'discount_total') && !Schema::hasColumn('orders', 'discount_amount')) {
                Schema::table('orders', function (Blueprint $table) {
                    $table->renameColumn('discount_total', 'discount_amount');
                });
            }

            // Rename timestamp columns to match model
            if (Schema::hasColumn('orders', 'placed_at') && !Schema::hasColumn('orders', 'ordered_at')) {
                Schema::table('orders', function (Blueprint $table) {
                    $table->renameColumn('placed_at', 'ordered_at');
                });
            }

            if (Schema::hasColumn('orders', 'closed_at') && !Schema::hasColumn('orders', 'completed_at')) {
                Schema::table('orders', function (Blueprint $table) {
                    $table->renameColumn('closed_at', 'completed_at');
                });
            }

            // Rename notes to special_instructions for consistency
            if (Schema::hasColumn('orders', 'notes') && !Schema::hasColumn('orders', 'special_instructions')) {
                Schema::table('orders', function (Blueprint $table) {
                    $table->renameColumn('notes', 'special_instructions');
                });
            }

        } catch (\Exception $e) {
            // Log but don't fail if rename fails (columns might already be correct)
            \Log::warning('Some column renames failed: ' . $e->getMessage());
        }

        // Add performance indexes
        Schema::table('orders', function (Blueprint $table) {
            // Composite index for common queries
            if (!$this->indexExists('orders', 'idx_orders_status_type')) {
                $table->index(['status', 'order_type'], 'idx_orders_status_type');
            }
            
            if (!$this->indexExists('orders', 'idx_orders_customer_status')) {
                $table->index(['customer_id', 'status'], 'idx_orders_customer_status');
            }
            
            if (!$this->indexExists('orders', 'idx_orders_location_status')) {
                $table->index(['location_id', 'status'], 'idx_orders_location_status');
            }

            if (!$this->indexExists('orders', 'idx_orders_scheduled')) {
                $table->index('scheduled_at', 'idx_orders_scheduled');
            }
        });

        // Ensure status and payment_status columns have correct enum values
        if ($driver === 'mysql') {
            try {
                // Standardize status enum
                if (Schema::hasColumn('orders', 'status')) {
                    DB::statement("ALTER TABLE `orders` MODIFY `status` ENUM('pending','received','preparing','ready','completed','cancelled') NOT NULL DEFAULT 'pending'");
                }
                
                // Ensure payment_status exists with correct values
                if (Schema::hasColumn('orders', 'payment_status')) {
                    DB::statement("ALTER TABLE `orders` MODIFY `payment_status` ENUM('unpaid','paid','refunded','partial') NOT NULL DEFAULT 'unpaid'");
                }

                // Ensure approval_status exists with correct values
                if (Schema::hasColumn('orders', 'approval_status')) {
                    DB::statement("ALTER TABLE `orders` MODIFY `approval_status` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending'");
                }
            } catch (\Exception $e) {
                \Log::warning('Enum modification failed: ' . $e->getMessage());
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Drop added columns
            $columns = ['delivery_fee', 'pickup_time', 'delivery_instructions'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('orders', $column)) {
                    $table->dropColumn($column);
                }
            }

            // Drop indexes
            $indexes = ['idx_orders_status_type', 'idx_orders_customer_status', 'idx_orders_location_status', 'idx_orders_scheduled'];
            foreach ($indexes as $index) {
                if ($this->indexExists('orders', $index)) {
                    $table->dropIndex($index);
                }
            }

            // Drop time_slot_id foreign key
            if (Schema::hasColumn('orders', 'time_slot_id')) {
                try {
                    $table->dropConstrainedForeignId('time_slot_id');
                } catch (\Exception $e) {
                    // Ignore if constraint doesn't exist
                }
            }
        });
    }

    /**
     * Check if an index exists
     */
    private function indexExists(string $table, string $index): bool
    {
        $conn = Schema::getConnection();
        $driver = $conn->getDriverName();

        if ($driver === 'mysql') {
            $db = $conn->getDatabaseName();
            $result = DB::select("SELECT COUNT(1) as cnt FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?", [$db, $table, $index]);
            return $result[0]->cnt > 0;
        }

        if ($driver === 'sqlite') {
            $indexes = DB::select("PRAGMA index_list('$table')");
            foreach ($indexes as $idx) {
                $name = is_object($idx) ? ($idx->name ?? null) : ($idx['name'] ?? null);
                if ($name === $index) {
                    return true;
                }
            }
        }

        return false;
    }
};

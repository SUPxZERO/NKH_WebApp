<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'location_id')) {
                $table->foreignId('location_id')->after('id')->constrained()->restrictOnDelete()->cascadeOnUpdate();
            }
            if (!Schema::hasColumn('orders', 'table_id')) {
                $table->foreignId('table_id')->nullable()->after('location_id')->constrained('tables')->nullOnDelete()->cascadeOnUpdate();
            }
            if (!Schema::hasColumn('orders', 'customer_id')) {
                $table->unsignedBigInteger('customer_id')->nullable()->after('table_id');
                $table->index('customer_id');
            }
            if (!Schema::hasColumn('orders', 'employee_id')) {
                $table->foreignId('employee_id')->nullable()->after('customer_id')->constrained()->nullOnDelete()->cascadeOnUpdate();
            }
            if (!Schema::hasColumn('orders', 'order_number')) {
                $table->string('order_number', 50)->after('employee_id');
            }
            if (!Schema::hasColumn('orders', 'type')) {
                $table->enum('type', ['dine_in','takeaway','delivery'])->default('dine_in')->after('order_number')->index();
            }
            if (!Schema::hasColumn('orders', 'status')) {
                $table->enum('status', ['open','completed','cancelled'])->default('open')->after('type')->index();
            }
            if (!Schema::hasColumn('orders', 'subtotal')) {
                $table->decimal('subtotal', 12, 2)->default(0)->after('status');
            }
            if (!Schema::hasColumn('orders', 'tax_total')) {
                $table->decimal('tax_total', 12, 2)->default(0)->after('subtotal');
            }
            if (!Schema::hasColumn('orders', 'discount_total')) {
                $table->decimal('discount_total', 12, 2)->default(0)->after('tax_total');
            }
            if (!Schema::hasColumn('orders', 'service_charge')) {
                $table->decimal('service_charge', 12, 2)->default(0)->after('discount_total');
            }
            if (!Schema::hasColumn('orders', 'total')) {
                $table->decimal('total', 12, 2)->default(0)->after('service_charge');
            }
            if (!Schema::hasColumn('orders', 'currency')) {
                $table->string('currency', 3)->default('USD')->after('total');
            }
            if (!Schema::hasColumn('orders', 'placed_at')) {
                $table->timestamp('placed_at')->nullable()->after('currency')->index();
            }
            if (!Schema::hasColumn('orders', 'closed_at')) {
                $table->timestamp('closed_at')->nullable()->after('placed_at')->index();
            }
            if (!Schema::hasColumn('orders', 'notes')) {
                $table->text('notes')->nullable()->after('closed_at');
            }
        });

        // Add composite unique if columns exist
        if (Schema::hasColumn('orders', 'location_id') && Schema::hasColumn('orders', 'order_number')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->unique(['location_id', 'order_number']);
            });
        }

        // If using MySQL and the status column exists, expand enum to new lifecycle values
        try {
            $driver = Schema::getConnection()->getDriverName();
            if ($driver === 'mysql' && Schema::hasColumn('orders', 'status')) {
                DB::statement("ALTER TABLE `orders` MODIFY `status` ENUM('pending_payment','received','in_kitchen','ready_for_pickup','out_for_delivery','completed','cancelled') NOT NULL DEFAULT 'pending_payment'");
            }
        } catch (\Throwable $e) {
            // ignore
        }
    }

    public function down(): void
    {
        // Do not drop columns to avoid data loss; this corrective migration is one-way.
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1) users: add unique index on phone if present and not already unique
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'phone')) {
            try {
                $dbName = \Illuminate\Support\Facades\DB::getDatabaseName();
                $exists = \Illuminate\Support\Facades\DB::table('information_schema.statistics')
                    ->where('table_schema', $dbName)
                    ->where('table_name', 'users')
                    ->where('column_name', 'phone')
                    ->where('non_unique', 0) // unique index
                    ->exists();
            } catch (\Throwable $e) { $exists = false; }

            if (! $exists) {
                Schema::table('users', function (Blueprint $table) {
                    try { $table->unique('phone', 'ux_users_phone'); } catch (\Throwable $e) { /* ignore */ }
                });
            }
        }

        // 2) floors: add required columns and FKs
        if (Schema::hasTable('floors')) {
            Schema::table('floors', function (Blueprint $table) {
                if (!Schema::hasColumn('floors', 'location_id')) {
                    $table->foreignId('location_id')->after('id')->constrained()->cascadeOnUpdate()->cascadeOnDelete();
                }
                if (!Schema::hasColumn('floors', 'name')) {
                    $table->string('name', 120)->after('location_id');
                }
                if (!Schema::hasColumn('floors', 'display_order')) {
                    $table->unsignedInteger('display_order')->default(0)->after('name');
                }
                if (!Schema::hasColumn('floors', 'is_active')) {
                    $table->boolean('is_active')->default(true)->after('display_order')->index();
                }
            });
        }

        // 3) suppliers
        if (Schema::hasTable('suppliers')) {
            Schema::table('suppliers', function (Blueprint $table) {
                if (!Schema::hasColumn('suppliers', 'location_id')) {
                    $table->foreignId('location_id')->after('id')->constrained()->cascadeOnUpdate()->cascadeOnDelete();
                }
                if (!Schema::hasColumn('suppliers', 'name')) {
                    $table->string('name', 150)->after('location_id');
                }
                if (!Schema::hasColumn('suppliers', 'contact_name')) {
                    $table->string('contact_name', 150)->nullable()->after('name');
                }
                if (!Schema::hasColumn('suppliers', 'email')) {
                    $table->string('email', 150)->nullable()->after('contact_name');
                }
                if (!Schema::hasColumn('suppliers', 'phone')) {
                    $table->string('phone', 50)->nullable()->after('email');
                }
                if (!Schema::hasColumn('suppliers', 'address')) {
                    $table->string('address', 255)->nullable()->after('phone');
                }
                if (!Schema::hasColumn('suppliers', 'tax_id')) {
                    $table->string('tax_id', 50)->nullable()->after('address');
                }
                if (!Schema::hasColumn('suppliers', 'is_active')) {
                    $table->boolean('is_active')->default(true)->after('tax_id')->index();
                }
            });
        }

        // 4) expense_categories
        if (Schema::hasTable('expense_categories')) {
            Schema::table('expense_categories', function (Blueprint $table) {
                if (!Schema::hasColumn('expense_categories', 'location_id')) {
                    $table->foreignId('location_id')->after('id')->constrained()->cascadeOnUpdate()->cascadeOnDelete();
                }
                if (!Schema::hasColumn('expense_categories', 'name')) {
                    $table->string('name', 120)->after('location_id');
                }
                if (!Schema::hasColumn('expense_categories', 'description')) {
                    $table->string('description', 255)->nullable()->after('name');
                }
                if (!Schema::hasColumn('expense_categories', 'is_active')) {
                    $table->boolean('is_active')->default(true)->after('description')->index();
                }
            });
        }

        // 5) expenses
        if (Schema::hasTable('expenses')) {
            Schema::table('expenses', function (Blueprint $table) {
                if (!Schema::hasColumn('expenses', 'location_id')) {
                    $table->foreignId('location_id')->after('id')->constrained()->cascadeOnUpdate()->cascadeOnDelete();
                }
                if (!Schema::hasColumn('expenses', 'expense_category_id')) {
                    $table->foreignId('expense_category_id')->after('location_id')->constrained('expense_categories')->cascadeOnUpdate()->restrictOnDelete();
                }
                if (!Schema::hasColumn('expenses', 'created_by')) {
                    $table->foreignId('created_by')->nullable()->after('expense_category_id')->constrained('users')->cascadeOnUpdate()->nullOnDelete();
                }
                if (!Schema::hasColumn('expenses', 'expense_date')) {
                    $table->date('expense_date')->after('created_by');
                }
                if (!Schema::hasColumn('expenses', 'amount')) {
                    $table->decimal('amount', 12, 2)->after('expense_date');
                }
                if (!Schema::hasColumn('expenses', 'currency')) {
                    $table->string('currency', 3)->default('USD')->after('amount');
                }
                if (!Schema::hasColumn('expenses', 'vendor_name')) {
                    $table->string('vendor_name', 150)->nullable()->after('currency');
                }
                if (!Schema::hasColumn('expenses', 'reference')) {
                    $table->string('reference', 100)->nullable()->after('vendor_name');
                }
                if (!Schema::hasColumn('expenses', 'description')) {
                    $table->text('description')->nullable()->after('reference');
                }
                if (!Schema::hasColumn('expenses', 'attachment_path')) {
                    $table->string('attachment_path', 255)->nullable()->after('description');
                }
                if (!Schema::hasColumn('expenses', 'status')) {
                    $table->enum('status', ['draft','approved','paid','voided'])->default('approved')->after('attachment_path')->index();
                }
            });
        }

        // 6) reservations
        if (Schema::hasTable('reservations')) {
            Schema::table('reservations', function (Blueprint $table) {
                if (!Schema::hasColumn('reservations', 'location_id')) {
                    $table->foreignId('location_id')->after('id')->constrained()->cascadeOnUpdate()->cascadeOnDelete();
                }
                if (!Schema::hasColumn('reservations', 'table_id')) {
                    $table->foreignId('table_id')->after('location_id')->constrained('tables')->cascadeOnUpdate()->cascadeOnDelete();
                }
                if (!Schema::hasColumn('reservations', 'customer_id')) {
                    $table->foreignId('customer_id')->after('table_id')->constrained('customers')->cascadeOnUpdate()->cascadeOnDelete();
                }
                if (!Schema::hasColumn('reservations', 'code')) {
                    $table->string('code', 20)->after('customer_id');
                }
                if (!Schema::hasColumn('reservations', 'reserved_for')) {
                    $table->dateTime('reserved_for')->after('code')->index();
                }
                if (!Schema::hasColumn('reservations', 'duration_minutes')) {
                    $table->unsignedInteger('duration_minutes')->default(60)->after('reserved_for');
                }
                if (!Schema::hasColumn('reservations', 'guest_count')) {
                    $table->unsignedInteger('guest_count')->default(2)->after('duration_minutes');
                }
                if (!Schema::hasColumn('reservations', 'status')) {
                    $table->enum('status', ['pending','confirmed','seated','cancelled','completed'])->default('pending')->after('guest_count')->index();
                }
                if (!Schema::hasColumn('reservations', 'notes')) {
                    $table->text('notes')->nullable()->after('status');
                }
                // Add unique(code) only if it doesn't already exist
                try {
                    $dbName = \Illuminate\Support\Facades\DB::getDatabaseName();
                    $exists = \Illuminate\Support\Facades\DB::table('information_schema.statistics')
                        ->where('table_schema', $dbName)
                        ->where('table_name', 'reservations')
                        ->where('column_name', 'code')
                        ->where('non_unique', 0)
                        ->exists();
                } catch (\Throwable $e) { $exists = false; }

                if (! $exists) {
                    try { $table->unique('code'); } catch (\Throwable $e) { /* ignore */ }
                }
            });
        }

        // 7) purchase_orders
        if (Schema::hasTable('purchase_orders')) {
            Schema::table('purchase_orders', function (Blueprint $table) {
                if (!Schema::hasColumn('purchase_orders', 'location_id')) {
                    $table->foreignId('location_id')->after('id')->constrained()->cascadeOnUpdate()->cascadeOnDelete();
                }
                if (!Schema::hasColumn('purchase_orders', 'supplier_id')) {
                    $table->foreignId('supplier_id')->after('location_id')->constrained('suppliers')->cascadeOnUpdate()->restrictOnDelete();
                }
                if (!Schema::hasColumn('purchase_orders', 'created_by')) {
                    $table->foreignId('created_by')->nullable()->after('supplier_id')->constrained('users')->cascadeOnUpdate()->nullOnDelete();
                }
                if (!Schema::hasColumn('purchase_orders', 'order_date')) {
                    $table->date('order_date')->after('created_by');
                }
                if (!Schema::hasColumn('purchase_orders', 'expected_date')) {
                    $table->date('expected_date')->nullable()->after('order_date');
                }
                if (!Schema::hasColumn('purchase_orders', 'received_at')) {
                    $table->dateTime('received_at')->nullable()->after('expected_date');
                }
                if (!Schema::hasColumn('purchase_orders', 'status')) {
                    $table->enum('status', ['draft','submitted','partial','received','cancelled'])->default('draft')->after('received_at')->index();
                }
                foreach ([
                    'subtotal' => 0,
                    'tax_total' => 0,
                    'discount_total' => 0,
                    'total' => 0,
                ] as $col => $default) {
                    if (!Schema::hasColumn('purchase_orders', $col)) {
                        $table->decimal($col, 12, 2)->default($default)->after('status');
                    }
                }
                if (!Schema::hasColumn('purchase_orders', 'currency')) {
                    $table->string('currency', 3)->default('USD')->after('total');
                }
                if (!Schema::hasColumn('purchase_orders', 'notes')) {
                    $table->text('notes')->nullable()->after('currency');
                }
            });
        }

        // 8) purchase_order_items
        if (Schema::hasTable('purchase_order_items')) {
            Schema::table('purchase_order_items', function (Blueprint $table) {
                if (!Schema::hasColumn('purchase_order_items', 'purchase_order_id')) {
                    $table->foreignId('purchase_order_id')->after('id')->constrained('purchase_orders')->cascadeOnUpdate()->cascadeOnDelete();
                }
                if (!Schema::hasColumn('purchase_order_items', 'ingredient_id')) {
                    $table->foreignId('ingredient_id')->after('purchase_order_id')->constrained('ingredients')->cascadeOnUpdate()->restrictOnDelete();
                }
                if (!Schema::hasColumn('purchase_order_items', 'quantity_ordered')) {
                    $table->decimal('quantity_ordered', 12, 3)->after('ingredient_id');
                }
                if (!Schema::hasColumn('purchase_order_items', 'quantity_received')) {
                    $table->decimal('quantity_received', 12, 3)->default(0)->after('quantity_ordered');
                }
                if (!Schema::hasColumn('purchase_order_items', 'unit_price')) {
                    $table->decimal('unit_price', 12, 2)->after('quantity_received');
                }
                foreach (['tax_amount','discount_amount'] as $col) {
                    if (!Schema::hasColumn('purchase_order_items', $col)) {
                        $table->decimal($col, 12, 2)->default(0)->after('unit_price');
                    }
                }
                if (!Schema::hasColumn('purchase_order_items', 'total')) {
                    $table->decimal('total', 12, 2)->after('discount_amount');
                }
                if (!Schema::hasColumn('purchase_order_items', 'status')) {
                    $table->enum('status', ['open','partial','closed','cancelled'])->default('open')->after('total')->index();
                }
            });
        }

        // 9) payments (fully define)
        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                if (!Schema::hasColumn('payments', 'invoice_id')) {
                    $table->foreignId('invoice_id')->after('id')->constrained('invoices')->cascadeOnUpdate()->cascadeOnDelete();
                }
                if (!Schema::hasColumn('payments', 'payment_method_id')) {
                    $table->foreignId('payment_method_id')->after('invoice_id')->constrained('payment_methods')->cascadeOnUpdate()->restrictOnDelete();
                }
                if (!Schema::hasColumn('payments', 'location_id')) {
                    $table->foreignId('location_id')->after('payment_method_id')->constrained('locations')->cascadeOnUpdate()->restrictOnDelete();
                }
                if (!Schema::hasColumn('payments', 'created_by')) {
                    $table->foreignId('created_by')->nullable()->after('location_id')->constrained('users')->cascadeOnUpdate()->nullOnDelete();
                }
                if (!Schema::hasColumn('payments', 'amount')) {
                    $table->decimal('amount', 12, 2)->after('created_by');
                }
                if (!Schema::hasColumn('payments', 'currency')) {
                    $table->string('currency', 3)->default('USD')->after('amount');
                }
                if (!Schema::hasColumn('payments', 'reference')) {
                    $table->string('reference', 100)->nullable()->after('currency');
                }
                if (!Schema::hasColumn('payments', 'transaction_id')) {
                    $table->string('transaction_id', 100)->nullable()->after('reference');
                }
                if (!Schema::hasColumn('payments', 'status')) {
                    $table->enum('status', ['pending','completed','failed','refunded','voided'])->default('completed')->after('transaction_id')->index();
                }
                if (!Schema::hasColumn('payments', 'paid_at')) {
                    $table->dateTime('paid_at')->after('status');
                }
                if (!Schema::hasColumn('payments', 'notes')) {
                    $table->text('notes')->nullable()->after('paid_at');
                }
            });
        }

        // 10) inventory_transactions
        if (Schema::hasTable('inventory_transactions')) {
            Schema::table('inventory_transactions', function (Blueprint $table) {
                if (!Schema::hasColumn('inventory_transactions', 'location_id')) {
                    $table->foreignId('location_id')->after('id')->constrained()->cascadeOnUpdate()->restrictOnDelete();
                }
                if (!Schema::hasColumn('inventory_transactions', 'ingredient_id')) {
                    $table->foreignId('ingredient_id')->after('location_id')->constrained('ingredients')->cascadeOnUpdate()->restrictOnDelete();
                }
                if (!Schema::hasColumn('inventory_transactions', 'type')) {
                    $table->enum('type', ['in','out','adjust'])->after('ingredient_id');
                }
                if (!Schema::hasColumn('inventory_transactions', 'quantity')) {
                    $table->decimal('quantity', 12, 3)->after('type');
                }
                if (!Schema::hasColumn('inventory_transactions', 'unit_cost')) {
                    $table->decimal('unit_cost', 12, 2)->nullable()->after('quantity');
                }
                if (!Schema::hasColumn('inventory_transactions', 'value')) {
                    $table->decimal('value', 12, 2)->nullable()->after('unit_cost');
                }
                if (!Schema::hasColumn('inventory_transactions', 'sourceable_type')) {
                    $table->string('sourceable_type', 100)->nullable()->after('value')->index();
                }
                if (!Schema::hasColumn('inventory_transactions', 'sourceable_id')) {
                    $table->unsignedBigInteger('sourceable_id')->nullable()->after('sourceable_type')->index();
                }
                if (!Schema::hasColumn('inventory_transactions', 'notes')) {
                    $table->string('notes', 255)->nullable()->after('sourceable_id');
                }
                if (!Schema::hasColumn('inventory_transactions', 'transacted_at')) {
                    $table->dateTime('transacted_at')->after('notes')->index();
                }
                if (!Schema::hasColumn('inventory_transactions', 'created_by')) {
                    $table->foreignId('created_by')->nullable()->after('transacted_at')->constrained('users')->cascadeOnUpdate()->nullOnDelete();
                }
            });
        }

        // 11) orders: add missing FK for customer_id using direct SQL (so we can safely try/catch)
        if (Schema::hasTable('orders') && Schema::hasColumn('orders', 'customer_id')) {
            try {
                $dbName = \Illuminate\Support\Facades\DB::getDatabaseName();
                $fkExists = \Illuminate\Support\Facades\DB::table('information_schema.KEY_COLUMN_USAGE')
                    ->where('TABLE_SCHEMA', $dbName)
                    ->where('TABLE_NAME', 'orders')
                    ->where('COLUMN_NAME', 'customer_id')
                    ->whereNotNull('REFERENCED_TABLE_NAME')
                    ->exists();

                if (! $fkExists) {
                    // Use a custom constraint name to avoid collisions with the default
                    \Illuminate\Support\Facades\DB::statement(
                        "ALTER TABLE `orders` ADD CONSTRAINT `fk_orders_customer_id` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE"
                    );
                }
            } catch (\Throwable $e) {
                // Intentionally ignore to keep migration idempotent across environments
            }
        }

        // 12) order_items: ensure required columns then add helpful composite index
        if (Schema::hasTable('order_items')) {
            Schema::table('order_items', function (Blueprint $table) {
                // Add missing columns safely
                if (!Schema::hasColumn('order_items', 'order_id')) {
                    $table->foreignId('order_id')->after('id')
                        ->constrained('orders')->cascadeOnUpdate()->cascadeOnDelete();
                }
                if (!Schema::hasColumn('order_items', 'menu_item_id')) {
                    $table->foreignId('menu_item_id')->after('order_id')
                        ->constrained('menu_items')->cascadeOnUpdate()->restrictOnDelete();
                }
                if (!Schema::hasColumn('order_items', 'quantity')) {
                    $table->unsignedSmallInteger('quantity')->default(1)->after('menu_item_id');
                }
                if (!Schema::hasColumn('order_items', 'unit_price')) {
                    $table->decimal('unit_price', 12, 2)->after('quantity');
                }
                if (!Schema::hasColumn('order_items', 'discount_amount')) {
                    $table->decimal('discount_amount', 12, 2)->default(0)->after('unit_price');
                }
                if (!Schema::hasColumn('order_items', 'tax_amount')) {
                    $table->decimal('tax_amount', 12, 2)->default(0)->after('discount_amount');
                }
                if (!Schema::hasColumn('order_items', 'total')) {
                    $table->decimal('total', 12, 2)->after('tax_amount');
                }
                if (!Schema::hasColumn('order_items', 'kitchen_status')) {
                    $table->enum('kitchen_status', ['pending','in_progress','ready','served','cancelled'])
                        ->default('pending')->after('total')->index();
                }
                if (!Schema::hasColumn('order_items', 'notes')) {
                    $table->text('notes')->nullable()->after('kitchen_status');
                }

                // Composite index (order_id, menu_item_id)
                try { $table->index(['order_id', 'menu_item_id'], 'idx_order_item_menu'); } catch (\Throwable $e) { /* ignore */ }
            });
        }
    }

    public function down(): void
    {
        // Non-destructive rollback intentionally left minimal to prevent data loss.
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'phone')) {
            Schema::table('users', function (Blueprint $table) {
                try { $table->dropUnique('ux_users_phone'); } catch (\Throwable $e) { /* ignore */ }
            });
        }
        if (Schema::hasTable('order_items')) {
            Schema::table('order_items', function (Blueprint $table) {
                try { $table->dropIndex('idx_order_item_menu'); } catch (\Throwable $e) { /* ignore */ }
            });
        }
    }
};

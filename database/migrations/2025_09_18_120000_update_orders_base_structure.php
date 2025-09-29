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
            if (!Schema::hasColumn('orders', 'preparation_status')) {
                $table->enum('preparation_status', ['pending', 'preparing', 'ready', 'served'])
                    ->default('pending')
                    ->after('type')
                    ->index();
            }

            if (!Schema::hasColumn('orders', 'priority')) {
                $table->integer('priority')->default(0)->after('preparation_status');
            }

            if (!Schema::hasColumn('orders', 'status')) {
                $table->enum('status', ['open', 'completed', 'cancelled'])->default('open')->after('type')->index();
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

        // Add composite unique if columns exist and index does not already exist
        if (Schema::hasColumn('orders', 'location_id') && Schema::hasColumn('orders', 'order_number')) {
            // On MySQL, avoid duplicate index creation
            $connection = Schema::getConnection();
            $driver = $connection->getDriverName();

            $shouldCreate = true;

            // MySQL: check information_schema for an existing index that covers the two columns.
            if ($driver === 'mysql') {
                $dbName = $connection->getDatabaseName();
                // Check for an index whose ordered columns match 'location_id,order_number'
                $row = DB::selectOne(
                    "SELECT INDEX_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? GROUP BY INDEX_NAME HAVING cols = ? LIMIT 1",
                    [$dbName, 'orders', 'location_id,order_number']
                );

                if ($row && isset($row->INDEX_NAME)) {
                    $shouldCreate = false;
                } else {
                    // Also check for the Laravel default index name just in case
                    $exists2 = DB::selectOne("SELECT COUNT(1) AS cnt FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?", [$dbName, 'orders', 'orders_location_id_order_number_unique']);
                    if ($exists2 && $exists2->cnt > 0) {
                        $shouldCreate = false;
                    }
                }
            }

            // SQLite: inspect PRAGMA index_list and PRAGMA index_info to detect an existing index
            if ($driver === 'sqlite') {
                try {
                    $indexes = DB::select("PRAGMA index_list('orders')");
                    foreach ($indexes as $idx) {
                        // index name might be in 'name' or '"name"' depending on driver; normalize
                        $indexName = is_object($idx) ? ($idx->name ?? $idx->Name ?? null) : null;
                        if (! $indexName) {
                            // Some drivers return associative arrays
                            $indexArr = (array) $idx;
                            $indexName = $indexArr['name'] ?? $indexArr['Name'] ?? null;
                        }

                        if (! $indexName) {
                            continue;
                        }

                        // If the index has the Laravel default name, avoid creating it
                        if ($indexName === 'orders_location_id_order_number_unique') {
                            $shouldCreate = false;
                            break;
                        }

                        // Otherwise inspect the indexed columns for a match
                        $cols = DB::select("PRAGMA index_info('".$indexName."')");
                        $colNames = array_map(function ($c) { return is_object($c) ? ($c->name ?? $c->Name ?? null) : ($c['name'] ?? $c['Name'] ?? null); }, $cols);
                        $colNames = array_values(array_filter($colNames));

                        if ($colNames === ['location_id', 'order_number'] || $colNames === ['order_number','location_id']) {
                            $shouldCreate = false;
                            break;
                        }
                    }
                } catch (\Throwable $e) {
                    // If any PRAGMA inspection fails for some reason, fall back to attempting creation.
                }
            }

            if ($shouldCreate) {
                Schema::table('orders', function (Blueprint $table) {
                    $table->unique(['location_id', 'order_number']);
                });
            }
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

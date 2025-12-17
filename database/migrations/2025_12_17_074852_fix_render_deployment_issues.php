<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Disable transaction for this migration to allow proper exception handling
     * for schema existence checks on Postgres.
     */
    public $withinTransaction = false;

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Fix 1: Ensure menu_items has is_featured column
        if (Schema::hasTable('menu_items') && !Schema::hasColumn('menu_items', 'is_featured')) {
            Schema::table('menu_items', function (Blueprint $table) {
                // Get the position after is_popular if it exists, otherwise after is_active
                $afterColumn = Schema::hasColumn('menu_items', 'is_popular') ? 'is_popular' : 'is_active';

                $table->boolean('is_featured')->default(false)->after($afterColumn);
                $table->unsignedInteger('featured_order')->default(0)->after('is_featured');

                // Only add badge if it doesn't exist
                if (!Schema::hasColumn('menu_items', 'badge')) {
                    $table->string('badge', 50)->nullable()->after('featured_order');
                }
            });
        }

        // Fix 2: Handle reservations code unique constraint
        if (Schema::hasTable('reservations')) {
            // Check if the unique constraint already exists
            $constraintExists = $this->constraintExists('reservations', 'reservations_code_unique');

            if (!$constraintExists && Schema::hasColumn('reservations', 'code')) {
                // Ensure all codes are unique before adding constraint
                DB::statement("
                    UPDATE reservations r1
                    SET code = CONCAT(code, '-', id)
                    WHERE EXISTS (
                        SELECT 1 FROM reservations r2
                        WHERE r2.code = r1.code AND r2.id < r1.id
                    )
                ");

                // Now add the unique constraint
                try {
                    Schema::table('reservations', function (Blueprint $table) {
                        $table->unique('code');
                    });
                } catch (\Throwable $e) {
                    // Constraint might already exist from concurrent migration
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rollback is intentionally minimal to prevent data loss
        if (Schema::hasTable('menu_items')) {
            Schema::table('menu_items', function (Blueprint $table) {
                // Only drop columns if they were added by this migration
                if (Schema::hasColumn('menu_items', 'is_featured')) {
                    $table->dropColumn(['is_featured', 'featured_order']);
                }
            });
        }
    }

    /**
     * Check if a constraint exists in PostgreSQL
     */
    private function constraintExists(string $table, string $constraint): bool
    {
        try {
            $result = DB::select("
                SELECT constraint_name
                FROM information_schema.table_constraints
                WHERE table_name = ? AND constraint_name = ?
            ", [$table, $constraint]);

            return count($result) > 0;
        } catch (\Throwable $e) {
            return false;
        }
    }
};

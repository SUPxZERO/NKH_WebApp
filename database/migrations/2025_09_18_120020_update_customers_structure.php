<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            if (!Schema::hasColumn('customers', 'user_id')) {
                $table->foreignId('user_id')->unique()->after('id')->constrained()->cascadeOnDelete()->cascadeOnUpdate();
            }
            if (!Schema::hasColumn('customers', 'preferred_location_id')) {
                $table->foreignId('preferred_location_id')->nullable()->after('user_id')->constrained('locations')->nullOnDelete()->cascadeOnUpdate();
            }
            if (!Schema::hasColumn('customers', 'birth_date')) {
                $table->date('birth_date')->nullable()->after('preferred_location_id');
            }
            if (!Schema::hasColumn('customers', 'gender')) {
                $table->string('gender', 20)->nullable()->after('birth_date');
            }
            if (!Schema::hasColumn('customers', 'preferences')) {
                $table->json('preferences')->nullable()->after('gender');
            }
            if (!Schema::hasColumn('customers', 'points_balance')) {
                $table->integer('points_balance')->default(0)->after('preferences');
            }
            if (!Schema::hasColumn('customers', 'notes')) {
                $table->text('notes')->nullable()->after('points_balance');
            }
        });

        // Helpful indexes
        if (Schema::hasColumn('customers', 'preferred_location_id')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->index('preferred_location_id');
            });
        }
    }

    public function down(): void
    {
        // Non-destructive rollback omitted intentionally.
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add parent_id if it doesn't exist
        if (!Schema::hasColumn('categories', 'parent_id')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->unsignedBigInteger('parent_id')->nullable()->after('location_id');
            });

            // Add foreign key constraint if column was just created
            try {
                Schema::table('categories', function (Blueprint $table) {
                    $table->foreign('parent_id')->references('id')->on('categories')->onDelete('cascade');
                });
            } catch (\Exception $e) {
                // Ignore if foreign key already exists or cannot be created
            }
        }

        // Add display_order if it doesn't exist
        if (!Schema::hasColumn('categories', 'display_order')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->integer('display_order')->default(0)->after('is_active');
            });

            // Add index for better performance (suppress errors if index exists)
            try {
                Schema::table('categories', function (Blueprint $table) {
                    $table->index(['parent_id', 'display_order']);
                });
            } catch (\Exception $e) {
                // Ignore index creation errors
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            // Drop foreign key if exists
            try {
                $table->dropForeign(['parent_id']);
            } catch (\Exception $e) {
                // ignore
            }

            // Drop index if exists
            try {
                $table->dropIndex(['parent_id', 'display_order']);
            } catch (\Exception $e) {
                // ignore
            }

            // Drop columns if they exist
            try {
                if (Schema::hasColumn('categories', 'parent_id')) {
                    $table->dropColumn('parent_id');
                }
                if (Schema::hasColumn('categories', 'display_order')) {
                    $table->dropColumn('display_order');
                }
            } catch (\Exception $e) {
                // ignore
            }
        });
    }
};

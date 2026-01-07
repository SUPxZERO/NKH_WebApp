<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds QR code fields to tables for QR-based table ordering.
     */
    public function up(): void
    {
        // Add QR fields to tables
        Schema::table('tables', function (Blueprint $table) {
            if (!Schema::hasColumn('tables', 'qr_token')) {
                $table->string('qr_token', 64)->unique()->nullable()->after('status');
            }
            if (!Schema::hasColumn('tables', 'qr_generated_at')) {
                $table->timestamp('qr_generated_at')->nullable()->after('qr_token');
            }
            if (!Schema::hasColumn('tables', 'qr_url')) {
                $table->string('qr_url', 255)->nullable()->after('qr_generated_at');
            }
        });

        // Add name and display_order to floors if missing
        Schema::table('floors', function (Blueprint $table) {
            if (!Schema::hasColumn('floors', 'name')) {
                $table->string('name', 100)->nullable()->after('id');
            }
            if (!Schema::hasColumn('floors', 'display_order')) {
                $table->unsignedInteger('display_order')->default(0)->after('name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tables', function (Blueprint $table) {
            $columns = [];
            if (Schema::hasColumn('tables', 'qr_token')) {
                $columns[] = 'qr_token';
            }
            if (Schema::hasColumn('tables', 'qr_generated_at')) {
                $columns[] = 'qr_generated_at';
            }
            if (Schema::hasColumn('tables', 'qr_url')) {
                $columns[] = 'qr_url';
            }
            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });

        Schema::table('floors', function (Blueprint $table) {
            $columns = [];
            if (Schema::hasColumn('floors', 'name')) {
                $columns[] = 'name';
            }
            if (Schema::hasColumn('floors', 'display_order')) {
                $columns[] = 'display_order';
            }
            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};

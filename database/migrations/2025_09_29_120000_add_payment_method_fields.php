<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_methods', function (Blueprint $table) {
            if (!Schema::hasColumn('payment_methods', 'code')) {
                $table->string('code', 30)->after('name');
                $table->unique('code');
            }
            if (!Schema::hasColumn('payment_methods', 'display_order')) {
                $table->unsignedInteger('display_order')->default(0)->after('code');
            }
            if (!Schema::hasColumn('payment_methods', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('display_order')->index();
            }
        });
    }

    public function down(): void
    {
        // No need to reverse these changes
    }
};
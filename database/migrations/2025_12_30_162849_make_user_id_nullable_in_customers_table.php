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
        Schema::table('customers', function (Blueprint $table) {
            // Drop foreign key and unique constraint first to allow modifications
            // Note: constraint name usually 'customers_user_id_foreign'
            $table->dropForeign(['user_id']);
            // $table->dropUnique(['user_id']); // Unique index might be needed or kept? If kept, multiple NULLs are allowed in MySQL.
            
            // Make user_id nullable
            $table->foreignId('user_id')->nullable()->change();
            
            // Re-add foreign key constraint but now it allows nulls
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete()->cascadeOnUpdate();

            // Add fields to store guest info directly on customer since they have no User
            $table->string('name')->nullable()->after('user_id');
            $table->string('email')->nullable()->after('name');
            $table->string('phone')->nullable()->after('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['name', 'email', 'phone']);
            
            // We can't easily revert nullable->not nullable without cleaning up nulls, 
            // so this down method is best effort or destructive.
            // For now, let's just attempt to restore assuming valid data.
            // $table->foreignId('user_id')->nullable(false)->change(); 
        });
    }
};

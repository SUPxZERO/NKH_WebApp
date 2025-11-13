<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update all passwords that use $2a$ prefix (old Bcrypt) to $2y$ (modern Bcrypt)
        DB::update("UPDATE users SET password = CONCAT('$2y$', SUBSTRING(password, 5)) WHERE password LIKE '$2a$%'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to $2a$ if needed
        DB::update("UPDATE users SET password = CONCAT('$2a$', SUBSTRING(password, 5)) WHERE password LIKE '$2y$%'");
    }
};


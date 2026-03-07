<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            $table->string('email', 255)->nullable()->after('phone');
            $table->string('logo_path', 255)->nullable()->after('email');
            $table->string('tax_registration_number', 100)->nullable()->after('logo_path');
            $table->decimal('default_tax_rate', 5, 2)->default(0.00)->after('tax_registration_number');
        });
    }

    public function down(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            $table->dropColumn(['email', 'logo_path', 'tax_registration_number', 'default_tax_rate']);
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * HOTFIX: Phase 3 migration - safely add missing columns
     */
    public function up(): void
    {
        // Add columns to users table (check if they exist first)
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'telegram_id')) {
                $table->bigInteger('telegram_id')->nullable()->unique()->after('email');
            }
            
            if (!Schema::hasColumn('users', 'avatar_url')) {
                $table->string('avatar_url')->nullable()->after('password');
            }
            
            if (!Schema::hasColumn('users', 'phone_verified_at')) {
                $table->timestamp('phone_verified_at')->nullable()->after('email_verified_at');
            }
            
            if (!Schema::hasColumn('users', 'last_login_at')) {
                $table->timestamp('last_login_at')->nullable();
            }
        });
        
        // Make email and password nullable
        DB::statement('ALTER TABLE users MODIFY email VARCHAR(255) NULL');
        DB::statement('ALTER TABLE users MODIFY password VARCHAR(255) NULL');
        
        // Create user_profiles table
        if (!Schema::hasTable('user_profiles')) {
            Schema::create('user_profiles', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->unique()->constrained()->onDelete('cascade');
                
                $table->string('customer_code', 20)->unique()->nullable();
                $table->date('birth_date')->nullable();
                $table->enum('gender', ['male', 'female', 'other'])->nullable();
                $table->string('preferred_language', 10)->default('en');
                $table->boolean('marketing_consent')->default(false);
                
                $table->integer('points_balance')->default(0);
                $table->enum('customer_tier', ['bronze', 'silver', 'gold', 'platinum'])->default('bronze');
                $table->timestamp('tier_updated_at')->nullable();
                
                $table->foreignId('preferred_location_id')->nullable()->constrained('locations')->onDelete('set null');
                $table->json('dietary_restrictions')->nullable();
                $table->json('favorite_menu_items')->nullable();
                
                $table->timestamp('last_order_at')->nullable();
                $table->decimal('total_spent', 10, 2)->default(0);
                $table->integer('total_orders')->default(0);
                
                $table->timestamps();
                
                $table->index('customer_tier');
                $table->index('points_balance');
            });
        }
        
        // Create authentication_methods table
        if (!Schema::hasTable('authentication_methods')) {
            Schema::create('authentication_methods', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                
                $table->enum('method', ['email_password', 'phone_otp', 'telegram', 'qr_guest'])->default('email_password');
                $table->string('identifier')->nullable();
                $table->timestamp('last_used_at')->nullable();
                $table->integer('use_count')->default(0);
                
                $table->timestamps();
                
                $table->index(['user_id', 'method']);
                $table->index('last_used_at');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('authentication_methods');
        Schema::dropIfExists('user_profiles');
        
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'telegram_id')) {
                $table->dropColumn('telegram_id');
            }
            if (Schema::hasColumn('users', 'avatar_url')) {
                $table->dropColumn('avatar_url');
            }
            if (Schema::hasColumn('users', 'phone_verified_at')) {
                $table->dropColumn('phone_verified_at');
            }
            if (Schema::hasColumn('users', 'last_login_at')) {
                $table->dropColumn('last_login_at');
            }
        });
    }
};

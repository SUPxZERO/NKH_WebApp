<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * PHASE 3: Enhance users table for unified identity system
     * 
     * This migration consolidates User/Customer/TelegramUser into single User model
     * 
     * Changes:
     * 1. Add telegram_id, phone to users table (multiple auth methods)
     * 2. Create user_profiles table (replaces Customer profile data)
     * 3. Create authentication_methods log table
     * 
     * Backwards compatible: Old Customer/TelegramUser tables remain during transition
     */
    public function up(): void
    {
        // Step 1: Enhance users table with additional identity fields
        Schema::table('users', function (Blueprint $table) {
            // Multiple authentication identifiers
            $table->string('phone', 20)->nullable()->unique()->after('email');
            $table->bigInteger('telegram_id')->nullable()->unique()->after('phone');
            
            // Make email nullable (Telegram-only users don't have email)
            $table->string('email')->nullable()->change();
            
            // Make password nullable (Telegram/QR users don't need password)
            $table->string('password')->nullable()->change();
            
            // Additional user fields
            $table->string('avatar_url')->nullable()->after('password');
            $table->timestamp('phone_verified_at')->nullable()->after('email_verified_at');
            $table->timestamp('last_login_at')->nullable();
            $table->boolean('is_active')->default(true);
            
            // Indexes for performance
            $table->index('telegram_id', 'idx_users_telegram_id');
            $table->index('phone', 'idx_users_phone');
            $table->index(['role', 'is_active'], 'idx_users_role_active');
        });

        // Step 2: Create user_profiles table (replaces Customer table data)
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->onDelete('cascade');
            
            // Customer identification
            $table->string('customer_code', 20)->unique()->nullable();
            
            // Personal information
            $table->date('birth_date')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->string('preferred_language', 10)->default('en');
            $table->boolean('marketing_consent')->default(false);
            
            // Loyalty program
            $table->integer('points_balance')->default(0);
            $table->enum('customer_tier', ['bronze', 'silver', 'gold', 'platinum'])->default('bronze');
            $table->timestamp('tier_updated_at')->nullable();
            
            // Preferences
            $table->foreignId('preferred_location_id')->nullable()->constrained('locations')->onDelete('set null');
            $table->json('dietary_restrictions')->nullable();
            $table->json('favorite_menu_items')->nullable(); // Cache for quick access
            
            // Metadata
            $table->timestamp('last_order_at')->nullable();
            $table->decimal('total_spent', 10, 2)->default(0);
            $table->integer('total_orders')->default(0);
            
            $table->timestamps();
            
            // Indexes
            $table->index('customer_tier', 'idx_profiles_tier');
            $table->index('points_balance', 'idx_profiles_points');
        });

        // Step 3: Create authentication_methods tracking table
        Schema::create('authentication_methods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            $table->enum('method', ['email_password', 'phone_otp', 'telegram', 'qr_guest'])->default('email_password');
            $table->string('identifier')->nullable(); // email, phone, or telegram_id
            $table->timestamp('last_used_at')->nullable();
            $table->integer('use_count')->default(0);
            
            $table->timestamps();
            
            // Indexes
            $table->index(['user_id', 'method'], 'idx_auth_methods_user_method');
            $table->index('last_used_at', 'idx_auth_methods_last_used');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('authentication_methods');
        Schema::dropIfExists('user_profiles');
        
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_telegram_id');
            $table->dropIndex('idx_users_phone');
            $table->dropIndex('idx_users_role_active');
            
            $table->dropColumn([
                'phone',
                'telegram_id',
                'avatar_url',
                'phone_verified_at',
                'last_login_at',
                'is_active',
            ]);
            
            // Restore constraints
            $table->string('email')->nullable(false)->change();
            $table->string('password')->nullable(false)->change();
        });
    }
};

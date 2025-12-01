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
            // Engagement tracking
            $table->dateTime('last_visit_date')->nullable()->after('total_spent');
            $table->dateTime('last_purchase_date')->nullable()->after('last_visit_date');
            $table->unsignedInteger('visit_count')->default(0)->after('last_purchase_date');
            $table->decimal('average_order_value', 10, 2)->default(0)->after('visit_count');
            
            // Loyalty tier system
            $table->enum('customer_tier', ['bronze', 'silver', 'gold', 'platinum'])
                ->default('bronze')
                ->after('average_order_value');
            
            // Referral program
            $table->string('referral_code', 20)->unique()->nullable()->after('customer_tier');
            
            // Verification statuses
            $table->timestamp('email_verified_at')->nullable()->after('marketing_consent');
            $table->timestamp('phone_verified_at')->nullable()->after('email_verified_at');
            
            // Enhanced preferences
            $table->json('communication_preferences')->nullable()->after('phone_verified_at')
                ->comment('Email/SMS/Push notification preferences');
            $table->json('tags')->nullable()->after('communication_preferences')
                ->comment('Customer segmentation tags (VIP, Corporate, etc.)');
            
            // Reliability tracking
            $table->unsignedInteger('no_show_count')->default(0)->after('tags')
                ->comment('Number of reservation no-shows');
            
            // Indexes for performance
            $table->index('customer_tier');
            $table->index('last_visit_date');
            $table->index(['customer_tier', 'total_spent']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex(['customer_tier']);
            $table->dropIndex(['last_visit_date']);
            $table->dropIndex(['customer_tier', 'total_spent']);
            
            // Drop columns
            $table->dropColumn([
                'last_visit_date',
                'last_purchase_date',
                'visit_count',
                'average_order_value',
                'customer_tier',
                'referral_code',
                'email_verified_at',
                'phone_verified_at',
                'communication_preferences',
                'tags',
                'no_show_count'
            ]);
        });
    }
};

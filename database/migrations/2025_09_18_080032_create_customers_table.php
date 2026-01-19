<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SQL Source: customers table
 * Engine: InnoDB | Charset: utf8mb4_unicode_ci
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('customer_code', 255)->unique();
            $table->integer('loyalty_points')->default(0);
            $table->unsignedBigInteger('loyalty_tier_id')->nullable();
            $table->decimal('total_spent', 10, 2)->default(0.00);
            $table->dateTime('last_visit_date')->nullable();
            $table->dateTime('last_purchase_date')->nullable();
            $table->unsignedInteger('visit_count')->default(0);
            $table->decimal('average_order_value', 10, 2)->default(0.00);
            $table->string('referral_code', 20)->nullable()->unique();
            $table->string('preferred_language', 255)->nullable();
            $table->json('dietary_preferences')->nullable();
            $table->boolean('marketing_consent')->default(false);
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('phone_verified_at')->nullable();
            $table->json('communication_preferences')->nullable()->comment('Email/SMS/Push notification preferences');
            $table->json('tags')->nullable()->comment('Customer segmentation tags (VIP, Corporate, etc.)');
            $table->unsignedInteger('no_show_count')->default(0)->comment('Number of reservation no-shows');
            $table->unsignedBigInteger('user_id')->nullable()->unique();
            $table->string('name', 255)->nullable();
            $table->string('email', 255)->nullable();
            $table->string('phone', 255)->nullable();
            $table->string('avatar', 255)->nullable();
            $table->unsignedBigInteger('preferred_location_id')->nullable()->index();
            $table->date('birth_date')->nullable();
            $table->string('gender', 20)->nullable();
            $table->json('preferences')->nullable();
            $table->integer('points_balance')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('last_visit_date');
            $table->index('total_spent', 'customers_customer_tier_total_spent_index');
            $table->index('email', 'idx_customers_email');
            $table->index('phone', 'idx_customers_phone');

            $table->foreign('loyalty_tier_id')->references('id')->on('loyalty_tiers')->onDelete('set null')->onUpdate('cascade');
            $table->foreign('preferred_location_id')->references('id')->on('locations')->onDelete('set null')->onUpdate('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};

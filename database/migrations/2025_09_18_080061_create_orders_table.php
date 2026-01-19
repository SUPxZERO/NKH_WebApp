<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SQL Source: orders table
 * Engine: InnoDB | Charset: utf8mb4_unicode_ci
 * Complex table with many FKs
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('location_id');
            $table->unsignedBigInteger('table_id')->nullable();
            $table->unsignedBigInteger('reservation_id')->nullable();
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->unsignedBigInteger('telegram_user_id')->nullable()->index();
            $table->unsignedBigInteger('employee_id')->nullable();
            $table->unsignedBigInteger('shift_id')->nullable();
            $table->string('order_number', 50);
            $table->enum('preparation_status', ['pending', 'preparing', 'ready', 'served'])->default('pending')->index();
            $table->integer('priority')->default(0);
            $table->unsignedBigInteger('order_status_id')->nullable();
            $table->decimal('subtotal', 12, 2)->default(0.00);
            $table->decimal('tax_amount', 12, 2)->default(0.00);
            $table->decimal('discount_amount', 12, 2)->default(0.00);
            $table->decimal('total_amount', 12, 2)->default(0.00);
            $table->decimal('service_charge', 12, 2)->default(0.00);
            $table->decimal('delivery_fee', 12, 2)->default(0.00);
            $table->string('currency', 3)->default('USD');
            $table->timestamp('ordered_at')->nullable()->index();
            $table->timestamp('completed_at')->nullable()->index();
            $table->text('special_instructions')->nullable();
            $table->text('delivery_instructions')->nullable();
            $table->timestamp('estimated_ready_time')->nullable();
            $table->timestamps();
            $table->unsignedBigInteger('order_type_id')->nullable();
            $table->unsignedBigInteger('promotion_id')->nullable();
            $table->unsignedBigInteger('customer_address_id')->nullable();
            $table->enum('payment_status', ['unpaid', 'paid', 'refunded', 'partial'])->default('unpaid')->index();
            $table->enum('payment_mode', ['pay_now', 'pay_on_delivery', 'pay_on_pickup', 'pay_at_counter'])->default('pay_now');
            $table->unsignedBigInteger('payment_collected_by')->nullable();
            $table->timestamp('payment_collected_at')->nullable();
            $table->string('payment_collection_notes', 500)->nullable();
            $table->timestamp('scheduled_at')->nullable()->index();
            $table->timestamp('pickup_time')->nullable();
            $table->timestamp('kitchen_submitted_at')->nullable();
            $table->unsignedBigInteger('time_slot_id')->nullable();
            $table->unsignedBigInteger('driver_id')->nullable();

            $table->unique(['location_id', 'order_number'], 'orders_location_order_unique');
            $table->unique(['location_id', 'order_number'], 'orders_location_id_order_number_unique');
            $table->index('customer_id', 'idx_orders_customer_status');
            $table->index('location_id', 'idx_orders_location_status');
            $table->index(['payment_mode', 'payment_status'], 'idx_order_payment_mode_status');
            $table->index(['location_id', 'created_at'], 'idx_orders_location_created');
            $table->index(['customer_id', 'created_at'], 'idx_orders_customer_created');
            $table->index(['customer_id', 'ordered_at'], 'idx_orders_customer_date');
            $table->index('ordered_at', 'idx_orders_status_date');
            $table->index('scheduled_at', 'idx_orders_scheduled');

            $table->foreign('location_id')->references('id')->on('locations')->onDelete('restrict')->onUpdate('cascade');
            $table->foreign('table_id')->references('id')->on('tables')->onDelete('set null')->onUpdate('cascade');
            $table->foreign('reservation_id')->references('id')->on('reservations')->onDelete('set null');
            $table->foreign('customer_id', 'fk_orders_customer_id')->references('id')->on('customers')->onDelete('set null')->onUpdate('cascade');
            $table->foreign('telegram_user_id')->references('id')->on('telegram_users')->onDelete('set null');
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('set null')->onUpdate('cascade');
            $table->foreign('shift_id')->references('id')->on('shifts')->onDelete('set null');
            $table->foreign('order_status_id')->references('id')->on('order_statuses')->onDelete('set null');
            $table->foreign('order_type_id')->references('id')->on('order_types')->onDelete('set null');
            $table->foreign('promotion_id')->references('id')->on('promotions')->onDelete('set null')->onUpdate('cascade');
            $table->foreign('customer_address_id')->references('id')->on('customer_addresses')->onDelete('set null')->onUpdate('cascade');
            $table->foreign('payment_collected_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('time_slot_id')->references('id')->on('order_time_slots')->onDelete('set null')->onUpdate('cascade');
            $table->foreign('driver_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};

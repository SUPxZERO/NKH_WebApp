<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SQL Source: purchase_orders table
 * Engine: InnoDB | Charset: utf8mb4_unicode_ci
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('location_id')->nullable();
            $table->unsignedBigInteger('supplier_id');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->string('po_number', 50)->nullable()->unique();
            $table->date('order_date');
            $table->date('expected_delivery_date')->nullable();
            $table->dateTime('received_date')->nullable();
            $table->date('expected_date')->nullable();
            $table->dateTime('received_at')->nullable();
            $table->enum('status', ['draft', 'pending', 'approved', 'ordered', 'partially_received', 'received', 'cancelled', 'submitted', 'partial'])->default('draft')->index();
            $table->decimal('total_amount', 12, 2)->default(0.00);
            $table->decimal('total', 12, 2)->default(0.00);
            $table->string('currency', 3)->default('USD');
            $table->text('notes')->nullable();
            $table->decimal('discount_total', 12, 2)->default(0.00);
            $table->decimal('tax_total', 12, 2)->default(0.00);
            $table->decimal('subtotal', 12, 2)->default(0.00);
            $table->timestamps();

            $table->foreign('location_id')->references('id')->on('locations')->onDelete('set null')->onUpdate('cascade');
            $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('restrict')->onUpdate('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};

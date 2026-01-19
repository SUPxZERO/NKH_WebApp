<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SQL Source: payments table
 * Engine: InnoDB | Charset: utf8mb4_unicode_ci
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->char('uuid', 36)->unique();
            $table->unsignedBigInteger('invoice_id');
            $table->unsignedBigInteger('payment_method_id');
            $table->decimal('amount', 12, 2);
            $table->decimal('tip', 10, 2)->default(0.00);
            $table->decimal('cash_received', 10, 2)->nullable();
            $table->decimal('change_given', 10, 2)->nullable();
            $table->unsignedBigInteger('confirmed_by')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->string('currency', 3)->default('USD');
            $table->decimal('exchange_rate', 10, 4)->default(1.0000);
            $table->decimal('amount_in_base_currency', 12, 2)->nullable();
            $table->string('transaction_id', 100)->unique();
            $table->string('reference_number', 100)->unique();
            $table->string('gateway_reference', 255)->nullable();
            $table->string('qr_reference', 100)->nullable();
            $table->unsignedBigInteger('payment_status_id')->nullable();
            $table->string('failure_reason', 255)->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('device_fingerprint', 255)->nullable();
            $table->json('metadata')->nullable();
            $table->tinyInteger('retry_count')->unsigned()->default(0);
            $table->text('notes')->nullable();
            $table->timestamp('initiated_at')->nullable();
            $table->timestamps();
            $table->string('idempotency_key', 64)->nullable()->unique();
            $table->string('client_ip', 45)->nullable();
            $table->timestamp('verified_at')->nullable();

            $table->index('processed_at', 'payments_status_processed_at_index');
            $table->index('qr_reference', 'idx_payments_qr');
            $table->index('initiated_at', 'idx_payments_initiated');
            $table->index('invoice_id', 'idx_payments_invoice_status');
            $table->index('created_at', 'idx_payments_status_created');

            $table->foreign('invoice_id')->references('id')->on('invoices')->onDelete('cascade')->onUpdate('cascade');
            $table->foreign('payment_method_id')->references('id')->on('payment_methods')->onDelete('restrict')->onUpdate('cascade');
            $table->foreign('confirmed_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('payment_status_id')->references('id')->on('payment_statuses')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};

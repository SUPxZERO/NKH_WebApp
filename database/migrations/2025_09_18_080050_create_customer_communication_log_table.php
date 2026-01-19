<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SQL Source: customer_communication_log table
 * Engine: InnoDB | Charset: utf8mb4_unicode_ci
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_communication_log', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('customer_id');
            $table->enum('type', ['email', 'sms', 'push', 'call']);
            $table->enum('category', ['marketing', 'transactional', 'reminder', 'feedback']);
            $table->string('subject', 255)->nullable();
            $table->text('message')->nullable();
            $table->timestamp('sent_at')->useCurrent();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('opened_at')->nullable();
            $table->timestamp('clicked_at')->nullable();
            $table->enum('status', ['queued', 'sent', 'delivered', 'failed', 'bounced'])->default('queued');
            $table->json('metadata')->nullable()->comment('Campaign ID, template ID, etc.');

            $table->index(['customer_id', 'sent_at']);
            $table->index(['status', 'sent_at']);

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_communication_log');
    }
};

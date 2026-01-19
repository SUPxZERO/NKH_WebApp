<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SQL Source: expenses table
 * Engine: InnoDB | Charset: utf8mb4_unicode_ci
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('location_id')->nullable();
            $table->unsignedBigInteger('expense_category_id');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->date('expense_date');
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('USD');
            $table->string('vendor_name', 150)->nullable();
            $table->string('reference', 100)->nullable();
            $table->text('description')->nullable();
            $table->string('attachment_path', 255)->nullable();
            $table->enum('status', ['draft', 'approved', 'paid', 'voided'])->default('approved')->index();
            $table->timestamps();

            $table->foreign('location_id')->references('id')->on('locations')->onDelete('cascade')->onUpdate('cascade');
            $table->foreign('expense_category_id')->references('id')->on('expense_categories')->onDelete('restrict')->onUpdate('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};

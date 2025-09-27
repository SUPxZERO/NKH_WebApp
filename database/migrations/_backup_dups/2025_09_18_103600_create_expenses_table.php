<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->constrained()->restrictOnDelete()->cascadeOnUpdate();
            $table->foreignId('expense_category_id')->constrained()->restrictOnDelete()->cascadeOnUpdate();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete()->cascadeOnUpdate();
            $table->date('expense_date')->index();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('USD');
            $table->string('vendor_name', 150)->nullable();
            $table->string('reference', 100)->nullable();
            $table->text('description')->nullable();
            $table->string('attachment_path')->nullable();
            $table->enum('status', ['recorded','approved','rejected','voided'])->default('recorded')->index();
            $table->timestamps();

            $table->index(['location_id', 'expense_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};

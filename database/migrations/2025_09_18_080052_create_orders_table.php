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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->constrained()->restrictOnDelete()->cascadeOnUpdate();
            $table->foreignId('table_id')->nullable()->constrained('tables')->nullOnDelete()->cascadeOnUpdate();
            // customer_id is created later in the 080057 migration, so avoid FK here
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->foreignId('employee_id')->nullable()->constrained()->nullOnDelete()->cascadeOnUpdate();
            $table->string('order_number', 50);
            $table->enum('type', ['dine_in','takeaway','delivery'])->default('dine_in')->index();
            $table->enum('status', ['open','completed','cancelled'])->default('open')->index();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('tax_total', 12, 2)->default(0);
            $table->decimal('discount_total', 12, 2)->default(0);
            $table->decimal('service_charge', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->string('currency', 3)->default('USD');
            $table->timestamp('placed_at')->nullable()->index();
            $table->timestamp('closed_at')->nullable()->index();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['location_id', 'order_number']);
            $table->index('customer_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};

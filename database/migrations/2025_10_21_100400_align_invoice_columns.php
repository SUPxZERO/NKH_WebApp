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
        Schema::table('invoices', function (Blueprint $table) {
            // Drop original columns
            $table->dropColumn(['tax_total', 'discount_total', 'total']);
            
            // Add new columns
            $table->decimal('tax_amount', 12, 2)->default(0)->after('subtotal');
            $table->decimal('discount_amount', 12, 2)->default(0)->after('tax_amount');
            $table->decimal('total_amount', 12, 2)->default(0)->after('discount_amount');
            
            // Add additional fields
            $table->enum('status', ['draft', 'issued', 'paid', 'cancelled'])->default('draft')->after('amount_due');
            $table->timestamp('due_at')->nullable()->after('issued_at');
            $table->timestamp('paid_at')->nullable()->after('due_at');
            $table->text('notes')->nullable()->after('paid_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['tax_amount', 'discount_amount', 'total_amount', 'status', 'due_at', 'paid_at', 'notes']);
            
            $table->decimal('tax_total', 12, 2)->default(0)->after('subtotal');
            $table->decimal('discount_total', 12, 2)->default(0)->after('tax_total');
            $table->decimal('total', 12, 2)->default(0)->after('discount_total');
        });
    }
};
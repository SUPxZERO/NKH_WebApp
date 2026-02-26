<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * AUDIT FIX (Phase D): Materialized Sales Summary table.
 * 
 * Instead of AnalyticsController hammering the `orders` table with SUM()
 * and COUNT() queries grouped by date across 1M+ rows, we pre-aggregate
 * sales data on a daily basis. 
 * 
 * A scheduled command will run nightly (and periodically) to populate this.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('daily_sales_summaries', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->unsignedInteger('location_id')->nullable();

            $table->unsignedInteger('total_orders')->default(0);
            $table->decimal('total_revenue', 12, 2)->default(0);
            $table->decimal('total_tax', 12, 2)->default(0);
            $table->decimal('total_discount', 12, 2)->default(0);
            $table->decimal('total_cogs', 12, 2)->default(0); // Cost of goods sold

            // Unique index ensures we can reliably UPSERT (Insert or Update)
            $table->unique(['date', 'location_id']);
            $table->index('date');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_sales_summaries');
    }
};

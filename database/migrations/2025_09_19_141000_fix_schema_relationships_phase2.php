<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // feedback table full definition
        if (Schema::hasTable('feedback')) {
            Schema::table('feedback', function (Blueprint $table) {
                if (!Schema::hasColumn('feedback', 'location_id')) {
                    $table->foreignId('location_id')->after('id')->constrained()->cascadeOnUpdate()->restrictOnDelete();
                }
                if (!Schema::hasColumn('feedback', 'order_id')) {
                    $table->foreignId('order_id')->after('location_id')->constrained()->cascadeOnUpdate()->cascadeOnDelete();
                }
                if (!Schema::hasColumn('feedback', 'customer_id')) {
                    $table->foreignId('customer_id')->after('order_id')->constrained('customers')->cascadeOnUpdate()->cascadeOnDelete();
                }
                if (!Schema::hasColumn('feedback', 'rating')) {
                    $table->unsignedTinyInteger('rating')->after('customer_id');
                }
                if (!Schema::hasColumn('feedback', 'comments')) {
                    $table->text('comments')->nullable()->after('rating');
                }
                if (!Schema::hasColumn('feedback', 'visibility')) {
                    $table->enum('visibility', ['public','private','internal'])->default('public')->after('comments');
                }
                try { $table->index(['customer_id']); } catch (\Throwable $e) { /* ignore */ }
                try { $table->index(['order_id']); } catch (\Throwable $e) { /* ignore */ }
            });
        }

        // loyalty_points table full definition
        if (Schema::hasTable('loyalty_points')) {
            Schema::table('loyalty_points', function (Blueprint $table) {
                if (!Schema::hasColumn('loyalty_points', 'customer_id')) {
                    $table->foreignId('customer_id')->after('id')->constrained('customers')->cascadeOnUpdate()->cascadeOnDelete();
                }
                if (!Schema::hasColumn('loyalty_points', 'order_id')) {
                    $table->foreignId('order_id')->nullable()->after('customer_id')->constrained('orders')->cascadeOnUpdate()->nullOnDelete();
                }
                if (!Schema::hasColumn('loyalty_points', 'location_id')) {
                    $table->foreignId('location_id')->after('order_id')->constrained()->cascadeOnUpdate()->restrictOnDelete();
                }
                if (!Schema::hasColumn('loyalty_points', 'type')) {
                    $table->enum('type', ['earn','redeem','adjust'])->after('location_id');
                }
                if (!Schema::hasColumn('loyalty_points', 'points')) {
                    $table->integer('points')->after('type');
                }
                if (!Schema::hasColumn('loyalty_points', 'balance_after')) {
                    $table->integer('balance_after')->after('points');
                }
                if (!Schema::hasColumn('loyalty_points', 'occurred_at')) {
                    $table->dateTime('occurred_at')->after('balance_after');
                }
                if (!Schema::hasColumn('loyalty_points', 'notes')) {
                    $table->string('notes', 255)->nullable()->after('occurred_at');
                }
                try { $table->index(['customer_id', 'occurred_at'], 'idx_loyalty_customer_time'); } catch (\Throwable $e) { /* ignore */ }
            });
        }
    }

    public function down(): void
    {
        // Minimal down to keep data safe; drop added indexes only
        if (Schema::hasTable('loyalty_points')) {
            Schema::table('loyalty_points', function (Blueprint $table) {
                try { $table->dropIndex('idx_loyalty_customer_time'); } catch (\Throwable $e) { /* ignore */ }
            });
        }
    }
};

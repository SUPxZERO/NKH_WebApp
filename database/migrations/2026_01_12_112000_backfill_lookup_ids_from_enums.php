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
        // 1. Backfill Order Types
        $types = DB::table('order_types')->get();
        foreach ($types as $type) {
            DB::table('orders')
                ->where('order_type', $type->code) // Assuming 'order_type' is the column name (formerly 'type')
                ->orWhere('order_type', $type->name) // Check name just in case
                ->update(['order_type_id' => $type->id]);
        }
        // Handle legacy 'type' column if it still exists and order_type was empty
        if (Schema::hasColumn('orders', 'type')) {
             foreach ($types as $type) {
                DB::table('orders')
                    ->whereNull('order_type_id')
                    ->where('type', $type->code)
                    ->update(['order_type_id' => $type->id]);
            }
        }

        // 2. Backfill Order Statuses
        $statuses = DB::table('order_statuses')->get();
        foreach ($statuses as $status) {
            DB::table('orders')
                ->where('status', $status->code)
                ->update(['order_status_id' => $status->id]);
        }

        // 3. Backfill Payment Statuses
        $paymentStatuses = DB::table('payment_statuses')->get();
        foreach ($paymentStatuses as $status) {
            DB::table('payments')
                ->where('status', $status->code)
                ->update(['payment_status_id' => $status->id]);
        }

        // 4. Backfill Loyalty Tiers
        // Calculate based on total_spent for customers without explicit tier
        // Or map from existing customer_tier string if it exists
        $tiers = DB::table('loyalty_tiers')->orderBy('min_spent', 'desc')->get();
        
        // First try to map from existing string column if it matches
        foreach ($tiers as $tier) {
            DB::table('customers')
                ->where('customer_tier', $tier->code)
                ->update(['loyalty_tier_id' => $tier->id]);
        }

        // Then calculate for any missing ones based on spend
        // This acts as a repair/initialization script
        foreach ($tiers as $tier) {
            $query = DB::table('customers')->whereNull('loyalty_tier_id');
            
            if ($tier->max_spent) {
                $query->whereBetween('total_spent', [$tier->min_spent, $tier->max_spent]);
            } else {
                $query->where('total_spent', '>=', $tier->min_spent);
            }
            
            $query->update(['loyalty_tier_id' => $tier->id]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('orders')->update(['order_type_id' => null, 'order_status_id' => null]);
        DB::table('payments')->update(['payment_status_id' => null]);
        DB::table('customers')->update(['loyalty_tier_id' => null]);
    }
};

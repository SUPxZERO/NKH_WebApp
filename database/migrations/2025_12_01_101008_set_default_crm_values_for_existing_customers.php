<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // Set default values for new CRM fields on existing customers
        // Use single quotes for PostgreSQL compatibility
        DB::table('customers')->update([
            'customer_tier' => DB::raw("COALESCE(customer_tier, 'bronze')"),
            'visit_count' => DB::raw('COALESCE(visit_count, 0)'),
            'average_order_value' => DB::raw('COALESCE(average_order_value, 0)'),
            'no_show_count' => DB::raw('COALESCE(no_show_count, 0)'),
        ]);

        // Generate referral codes for customers that don't have one
        $customersWithoutReferral = DB::table('customers')
            ->whereNull('referral_code')
            ->get();

        foreach ($customersWithoutReferral as $customer) {
            DB::table('customers')
                ->where('id', $customer->id)
                ->update([
                    'referral_code' => 'REF-' . strtoupper(Str::random(6))
                ]);
        }
    }

    public function down(): void
    {
        // No need to reverse this
    }
};

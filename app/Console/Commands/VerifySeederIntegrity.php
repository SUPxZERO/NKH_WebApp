<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class VerifySeederIntegrity extends Command
{
    protected $signature = 'seed:verify';
    protected $description = 'Verify relational integrity of seeded data';

    public function handle()
    {
        $this->info('=== ROW COUNTS ===');
        $tables = [
            'attendances', 'payrolls', 'feedback', 'refunds', 'stock_movements',
            'daily_sales_summaries', 'customer_addresses', 'customer_favorites',
            'customer_preferences', 'cart_items', 'table_sessions', 'order_time_slots',
            'operating_hours', 'expense_categories', 'notification_preferences', 'user_settings',
        ];
        foreach ($tables as $t) {
            $this->line(str_pad($t, 30) . ': ' . DB::table($t)->count());
        }

        $this->newLine();
        $this->info('=== RELATIONAL INTEGRITY ===');

        // 1. Feedback customer = order customer
        $tf = DB::table('feedback')->count();
        $mf = DB::table('feedback')
            ->join('orders', 'orders.id', '=', 'feedback.order_id')
            ->whereColumn('orders.customer_id', 'feedback.customer_id')
            ->count();
        $this->line("Feedback customer=order customer: $mf / $tf");

        // 2. Stock movements from orders
        $ls = DB::table('stock_movements')->whereNotNull('reference_id')->count();
        $ts = DB::table('stock_movements')->count();
        $this->line("Stock movements from orders: $ls / $ts");

        // 3. Daily sales
        $ds = DB::table('daily_sales_summaries')->count();
        $this->line("Daily sales summary days: $ds");

        // 4. Refunds linked to payments
        $tr = DB::table('refunds')->count();
        $lr = DB::table('refunds')
            ->join('payments', 'payments.id', '=', 'refunds.payment_id')
            ->count();
        $this->line("Refunds linked to payments: $lr / $tr");

        // 5. Cart from favorites
        $tc = DB::table('cart_items')->count();
        $lc = DB::table('cart_items')
            ->join('customer_favorites', function ($j) {
                $j->on('cart_items.customer_id', '=', 'customer_favorites.customer_id')
                  ->on('cart_items.menu_item_id', '=', 'customer_favorites.menu_item_id');
            })->count();
        $this->line("Cart from favorites: $lc / $tc");

        return 0;
    }
}

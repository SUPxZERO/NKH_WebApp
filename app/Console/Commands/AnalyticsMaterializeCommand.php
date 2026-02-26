<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * AUDIT FIX (Phase D): Materializes sales data into daily_sales_summaries.
 * 
 * Run via scheduler daily, and hourly for the current day to keep dashboards fast.
 */
class AnalyticsMaterializeCommand extends Command
{
    protected $signature = 'analytics:materialize {--date= : The specific date to materialize (Y-m-d)} {--days=1 : Number of past days to rebuild}';
    protected $description = 'Materialize order data into daily_sales_summaries table for fast analytics';

    public function handle()
    {
        $dateStr = $this->option('date');
        $days = (int) $this->option('days');

        $datesToProcess = [];

        if ($dateStr) {
            $datesToProcess[] = Carbon::parse($dateStr);
        } else {
            for ($i = 0; $i < $days; $i++) {
                $datesToProcess[] = now()->subDays($i);
            }
        }

        $this->info("Materializing sales data for " . count($datesToProcess) . " date(s)...");

        foreach ($datesToProcess as $date) {
            $startOfDay = $date->copy()->startOfDay();
            $endOfDay = $date->copy()->endOfDay();

            $this->info("Processing {$startOfDay->toDateString()}...");

            // Aggregate directly in the DB and UPSERT into the materialized table
            // This is O(N) where N is orders for ONE day, not the whole table
            $aggregates = DB::table('orders')
                ->join('order_statuses', 'orders.order_status_id', '=', 'order_statuses.id')
                ->whereBetween('orders.created_at', [$startOfDay, $endOfDay])
                ->where('order_statuses.code', '!=', 'cancelled')
                ->select(
                    DB::raw('DATE(orders.created_at) as date'),
                    'orders.location_id',
                    DB::raw('COUNT(orders.id) as total_orders'),
                    DB::raw('SUM(orders.total_amount) as total_revenue'),
                    DB::raw('SUM(orders.tax_amount) as total_tax'),
                    DB::raw('SUM(orders.discount_amount) as total_discount')
                )
                ->groupBy('date', 'orders.location_id')
                ->get();

            if ($aggregates->isEmpty()) {
                continue;
            }

            // We need to calculate COGS separately since cost_price is on order_items
            $cogsAggregates = DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->join('order_statuses', 'orders.order_status_id', '=', 'order_statuses.id')
                ->whereBetween('orders.created_at', [$startOfDay, $endOfDay])
                ->where('order_statuses.code', '!=', 'cancelled')
                ->select(
                    DB::raw('DATE(orders.created_at) as date'),
                    'orders.location_id',
                    DB::raw('SUM(order_items.quantity * order_items.cost_price) as total_cogs')
                )
                ->groupBy('date', 'orders.location_id')
                ->get()
                ->keyBy(function ($item) {
                    return $item->date . '_' . $item->location_id;
                });

            $upsertData = [];

            foreach ($aggregates as $row) {
                // Ensure Location ID exists because unique constraint requires a value
                if (!$row->location_id)
                    continue;

                $key = $row->date . '_' . $row->location_id;
                $cogs = $cogsAggregates->has($key) ? $cogsAggregates->get($key)->total_cogs : 0;

                $upsertData[] = [
                    'date' => $row->date,
                    'location_id' => $row->location_id,
                    'total_orders' => $row->total_orders,
                    'total_revenue' => $row->total_revenue,
                    'total_tax' => $row->total_tax,
                    'total_discount' => $row->total_discount,
                    'total_cogs' => $cogs,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            if (!empty($upsertData)) {
                DB::table('daily_sales_summaries')->upsert(
                    $upsertData,
                    ['date', 'location_id'], // Unique columns
                    ['total_orders', 'total_revenue', 'total_tax', 'total_discount', 'total_cogs', 'updated_at'] // Update columns
                );
            }
        }

        $this->info('Materialization complete!');
        return self::SUCCESS;
    }
}

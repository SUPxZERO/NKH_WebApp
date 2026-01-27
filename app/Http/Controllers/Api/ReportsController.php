<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\Ingredient;
use App\Models\InventoryTransaction;
use App\Models\InventoryAdjustment;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportsController extends Controller
{
    // ====================
    // INVENTORY REPORTS
    // ====================

    public function inventoryValuation(Request $request): JsonResponse
    {
        $dates = $this->getDateRangeFromRequest($request);

        $currentValue = Inventory::join('ingredients', 'inventory.ingredient_id', '=', 'ingredients.id')
            ->select(DB::raw('SUM(inventory.quantity * ingredients.cost_per_unit) as total_value'))
            ->first();

        $previousValue = Inventory::join('ingredients', 'inventory.ingredient_id', '=', 'ingredients.id')
            ->where('inventory.updated_at', '<', $dates['start'])
            ->select(DB::raw('SUM(inventory.quantity * ingredients.cost_per_unit) as total_value'))
            ->first();

        $changePercent = $previousValue->total_value > 0
            ? (($currentValue->total_value - $previousValue->total_value) / $previousValue->total_value) * 100
            : 0;

        return response()->json([
            'total_value' => (float) ($currentValue->total_value ?? 0),
            'items_count' => (int) Inventory::count(),
            'change_percent' => round((float) $changePercent, 2)
        ]);
    }

    public function usageRates(Request $request): JsonResponse
    {
        $dates = $this->getDateRangeFromRequest($request);
        $range = $request->get('range', '30days');
        $groupBy = $this->getGroupByFormat($range);
        $groupBy = str_replace('created_at', 'inventory_transactions.created_at', $groupBy);

        $usage = InventoryTransaction::whereBetween('inventory_transactions.created_at', [$dates['start'], $dates['end']])
            ->where('inventory_transactions.type', 'usage')
            ->select([
                DB::raw($groupBy . ' as date'),
                DB::raw('SUM(quantity) as usage')
            ])
            ->groupBy(DB::raw($groupBy))
            ->orderBy(DB::raw($groupBy))
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'usage' => (float) $item->usage
                ];
            });

        return response()->json(['data' => $usage]);
    }

    public function wasteTracking(Request $request): JsonResponse
    {
        $dates = $this->getDateRangeFromRequest($request);

        $wasteByReason = InventoryAdjustment::whereBetween('inventory_adjustments.created_at', [$dates['start'], $dates['end']])
            ->whereIn('inventory_adjustments.reason', ['damaged', 'expired', 'spillage', 'theft'])
            ->join('ingredients', 'inventory_adjustments.ingredient_id', '=', 'ingredients.id')
            ->select([
                'inventory_adjustments.reason',
                DB::raw('ABS(SUM(inventory_adjustments.quantity_change * ingredients.cost_per_unit)) as value')
            ])
            ->groupBy('inventory_adjustments.reason')
            ->get()
            ->map(function ($item) {
                return [
                    'reason' => $item->reason,
                    'value' => (float) $item->value
                ];
            });

        $totalWaste = (float) $wasteByReason->sum('value');
        $totalRevenue = Order::whereBetween('orders.created_at', [$dates['start'], $dates['end']])
            ->whereDoesntHave('orderStatus', fn($q) => $q->where('code', 'cancelled'))
            ->sum('total_amount');

        return response()->json([
            'by_reason' => $wasteByReason,
            'total_waste_value' => (float) $totalWaste,
            'waste_percent' => $totalRevenue > 0 ? round(($totalWaste / $totalRevenue) * 100, 2) : 0
        ]);
    }

    public function costAnalysis(Request $request): JsonResponse
    {
        $range = $request->get('range', '30days');

        $topItems = Ingredient::select([
            'ingredients.id',
            'ingredients.name',
            'ingredients.cost_per_unit',
            'ingredients.current_stock as quantity',
            DB::raw('(ingredients.current_stock * ingredients.cost_per_unit) as total_cost')
        ])
            ->with('unit:id,code')
            ->orderByDesc('total_cost')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                $item->unit = $item->unit?->code ?? 'unit';
                return $item;
            });

        $categories = Ingredient::select([
            'ingredients.category as name',
            DB::raw('SUM(ingredients.current_stock * ingredients.cost_per_unit) as value')
        ])
            ->groupBy('ingredients.category')
            ->get();

        return response()->json([
            'top_items' => $topItems,
            'categories' => $categories
        ]);
    }

    public function inventoryTurnover(Request $request): JsonResponse
    {
        $dates = $this->getDateRangeFromRequest($request);

        // Calculate turnover by category
        $turnoverByCategory = Ingredient::select([
            'category',
            DB::raw('COUNT(*) as items'),
            DB::raw('AVG(CASE WHEN current_stock > 0 THEN (max_stock_level / current_stock) ELSE 0 END) as turnover_rate')
        ])
            ->groupBy('category')
            ->get()
            ->map(function ($item) {
                return [
                    'category' => $item->category,
                    'items' => (int) $item->items,
                    'turnover_rate' => round((float) $item->turnover_rate, 2)
                ];
            });

        $avgTurnover = (float) $turnoverByCategory->avg('turnover_rate');

        return response()->json([
            'avg_turnover' => round($avgTurnover, 2),
            'by_category' => $turnoverByCategory
        ]);
    }

    // ====================
    // FINANCIAL REPORTS
    // ====================

    public function profitLoss(Request $request): JsonResponse
    {
        $dates = $this->getDateRangeFromRequest($request);

        $totalRevenue = Order::whereBetween('orders.created_at', [$dates['start'], $dates['end']])
            ->whereDoesntHave('orderStatus', fn($q) => $q->where('code', 'cancelled'))
            ->sum('orders.total_amount');

        $totalExpenses = Expense::whereBetween('expense_date', [$dates['start'], $dates['end']])
            ->sum('amount');

        // Calculate COGS
        $cogs = InventoryTransaction::whereBetween('inventory_transactions.created_at', [$dates['start'], $dates['end']])
            ->where('inventory_transactions.type', 'usage')
            ->join('ingredients', 'inventory_transactions.ingredient_id', '=', 'ingredients.id')
            ->select(DB::raw('SUM(inventory_transactions.quantity * ingredients.cost_per_unit) as total'))
            ->first();

        $totalCogs = (float) ($cogs->total ?? 0);
        $totalExpensesWithCogs = (float) ($totalExpenses + $totalCogs);
        $netProfit = (float) ($totalRevenue - $totalExpensesWithCogs);
        $profitMargin = $totalRevenue > 0 ? ($netProfit / $totalRevenue) * 100 : 0;

        // Calculate changes (simple mock or comparison with previous period)
        $prevDates = [
            'start' => (clone $dates['start'])->subDays($dates['start']->diffInDays($dates['end']) + 1),
            'end' => (clone $dates['start'])->subSecond()
        ];

        $prevRevenue = Order::whereBetween('orders.created_at', [$prevDates['start'], $prevDates['end']])
            ->whereDoesntHave('orderStatus', fn($q) => $q->where('code', 'cancelled'))
            ->sum('orders.total_amount');

        $revenueChange = $prevRevenue > 0 ? (($totalRevenue - $prevRevenue) / $prevRevenue) * 100 : 0;

        // Expense breakdown
        $expenseCategories = Expense::whereBetween('expenses.expense_date', [$dates['start'], $dates['end']])
            ->leftJoin('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->select([
                DB::raw("COALESCE(expense_categories.name, 'Other') as category"),
                DB::raw('SUM(expenses.amount) as amount')
            ])
            ->groupBy('category')
            ->get()
            ->map(function ($cat) use ($totalExpensesWithCogs) {
                return [
                    'category' => $cat->category,
                    'amount' => (float) $cat->amount,
                    'percentage' => $totalExpensesWithCogs > 0 ? round(($cat->amount / $totalExpensesWithCogs) * 100, 1) : 0,
                    'change' => 0 // Set to 0 for now as proper trend per category needs more queries
                ];
            });

        return response()->json([
            'total_revenue' => (float) $totalRevenue,
            'total_expenses' => (float) $totalExpensesWithCogs,
            'net_profit' => (float) $netProfit,
            'profit_margin' => round((float) $profitMargin, 2),
            'revenue_change' => round((float) $revenueChange, 1),
            'expenses_change' => 0,
            'expense_categories' => $expenseCategories
        ]);
    }

    public function revenueExpenses(Request $request): JsonResponse
    {
        $dates = $this->getDateRangeFromRequest($request);
        $range = $request->get('range', '30days');
        $groupBy = $this->getGroupByFormat($range);
        $groupBy = str_replace('created_at', 'orders.created_at', $groupBy);

        $data = DB::table('orders')
            ->join('order_statuses', 'orders.order_status_id', '=', 'order_statuses.id')
            ->whereBetween('orders.created_at', [$dates['start'], $dates['end']])
            ->where('order_statuses.code', '!=', 'cancelled')
            ->select([
                DB::raw($groupBy . ' as date'),
                DB::raw('SUM(orders.total_amount) as revenue')
            ])
            ->groupBy(DB::raw($groupBy))
            ->orderBy(DB::raw($groupBy))
            ->get()
            ->map(function ($item) use ($groupBy) {
                // Get expenses for the same date
                $dateStr = $item->date;
                $driver = DB::connection()->getDriverName();
                $isSqlite = $driver === 'sqlite';

                $expenses = Expense::when(
                    $groupBy === ($isSqlite ? "date(orders.created_at)" : "DATE(orders.created_at)"),
                    fn($q) => $q->whereDate('expense_date', $dateStr),
                    fn($q) => $q->whereRaw($isSqlite ? "strftime('%Y-%m', expense_date) = ?" : "DATE_FORMAT(expense_date, '%Y-%m') = ?", [$dateStr])
                )->sum('amount');

                // Add COGS for the same date/period
                $cogs = InventoryTransaction::where('inventory_transactions.type', 'usage')
                    ->join('ingredients', 'inventory_transactions.ingredient_id', '=', 'ingredients.id')
                    ->when(
                        $groupBy === ($isSqlite ? "date(orders.created_at)" : "DATE(orders.created_at)"),
                        fn($q) => $q->whereDate('inventory_transactions.created_at', $dateStr),
                        fn($q) => $q->whereRaw($isSqlite ? "strftime('%Y-%m', inventory_transactions.created_at) = ?" : "DATE_FORMAT(inventory_transactions.created_at, '%Y-%m') = ?", [$dateStr])
                    )
                    ->select(DB::raw('SUM(inventory_transactions.quantity * ingredients.cost_per_unit) as total'))
                    ->first();

                $dayExpenses = (float) $expenses + (float) ($cogs->total ?? 0);

                return [
                    'date' => $item->date,
                    'revenue' => (float) $item->revenue,
                    'expenses' => (float) $dayExpenses,
                    'profit' => (float) ($item->revenue - $dayExpenses)
                ];
            });

        return response()->json(['data' => $data]);
    }

    public function cogs(Request $request): JsonResponse
    {
        $dates = $this->getDateRangeFromRequest($request);

        $breakdown = InventoryTransaction::whereBetween('inventory_transactions.created_at', [$dates['start'], $dates['end']])
            ->where('inventory_transactions.type', 'usage')
            ->join('ingredients', 'inventory_transactions.ingredient_id', '=', 'ingredients.id')
            ->select([
                'ingredients.category as name',
                DB::raw('SUM(inventory_transactions.quantity * ingredients.cost_per_unit) as value')
            ])
            ->groupBy('ingredients.category')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->name ?? 'Uncategorized',
                    'value' => (float) $item->value
                ];
            })
            ->filter(fn($item) => $item['value'] > 0)
            ->values();

        $total = $breakdown->sum('value');
        $revenue = Order::whereBetween('orders.created_at', [$dates['start'], $dates['end']])
            ->whereDoesntHave('orderStatus', fn($q) => $q->where('code', 'cancelled'))
            ->sum('orders.total_amount');

        return response()->json([
            'breakdown' => $breakdown,
            'total' => (float) $total,
            'percentage_of_revenue' => $revenue > 0 ? round(($total / $revenue) * 100, 2) : 0
        ]);
    }

    public function margins(Request $request): JsonResponse
    {
        $dates = $this->getDateRangeFromRequest($request);

        $marginsByCategory = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->leftJoin('categories', 'menu_items.category_id', '=', 'categories.id')
            ->leftJoin('category_translations', function ($join) {
                $join->on('categories.id', '=', 'category_translations.category_id')
                    ->where('category_translations.locale', '=', app()->getLocale());
            })
            ->leftJoin('order_statuses', 'orders.order_status_id', '=', 'order_statuses.id')
            ->whereBetween('orders.created_at', [$dates['start'], $dates['end']])
            ->where(function ($q) {
                $q->where('order_statuses.code', '!=', 'cancelled')
                    ->orWhereNull('order_statuses.code');
            })
            ->select([
                DB::raw("COALESCE(category_translations.name, categories.slug, 'Uncategorized') as category"),
                DB::raw('SUM(order_items.total_price) as revenue'),
                DB::raw('SUM(order_items.total_price * 0.3) as cost'), // Mock cost as 30% of revenue
            ])
            ->groupBy('category')
            ->get()
            ->map(function ($item) {
                $revenue = (float) $item->revenue;
                $cost = (float) $item->cost;
                $margin = $revenue > 0 ? (($revenue - $cost) / $revenue) * 100 : 0;
                return [
                    'category' => $item->category,
                    'revenue' => $revenue,
                    'cost' => $cost,
                    'margin' => round($margin, 2)
                ];
            });

        return response()->json([
            'by_category' => $marginsByCategory
        ]);
    }

    private function getDateRangeFromRequest(Request $request): array
    {
        if ($request->has('start_date') && $request->has('end_date')) {
            return [
                'start' => Carbon::parse($request->start_date)->startOfDay(),
                'end' => Carbon::parse($request->end_date)->endOfDay(),
            ];
        }

        return $this->getDateRange($request->get('range', '30days'));
    }

    private function getDateRange(string $range): array
    {
        $end = Carbon::now();

        switch ($range) {
            case 'today':
                $start = Carbon::today();
                break;
            case '7days':
                $start = Carbon::now()->subDays(7);
                break;
            case '30days':
                $start = Carbon::now()->subDays(30);
                break;
            case '90days':
                $start = Carbon::now()->subDays(90);
                break;
            case 'year':
                $start = Carbon::now()->subYear();
                break;
            default:
                $start = Carbon::now()->subDays(30);
        }

        return ['start' => $start, 'end' => $end];
    }

    public function dailySalesReport(Request $request): JsonResponse
    {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 20);
        $category = $request->input('category', 'all');
        $paymentMethod = $request->input('payment_method', 'all');

        $driver = DB::connection()->getDriverName();
        $isSqlite = $driver === 'sqlite';
        $dateSql = $isSqlite ? "date(orders.created_at)" : "DATE(orders.created_at)";

        // Base query for orders
        $query = Order::query()
            ->whereHas('orderStatus', fn($q) => $q->where('code', 'completed')) // Or paid? Usually completed orders are final.
            ->when($startDate && $endDate, function ($q) use ($startDate, $endDate) {
                return $q->whereBetween('orders.created_at', [$startDate, $endDate]);
            })
            ->when(!$startDate, function ($q) {
                return $q->whereDate('orders.created_at', '>=', Carbon::now()->subDays(30));
            });

        // Apply filters (more complex filters like category requiring joins would go here)
        // For simplicity, category filter is applied at row level or subquery level if needed. 
        // But Sales Report as requested aggregates by DATE. Filtering by category for a "Daily Summary" means "Sales of Category X per day".

        if ($category !== 'all') {
            $query->whereHas('items.menuItem', function ($q) use ($category) {
                $q->where('category_id', $category);
            });
        }

        if ($paymentMethod !== 'all') {
            // Assuming payment_method column exists or relationship to payments
            // For now, check 'payment_method' column on orders if it exists, or 'payments' table.
            // Based on typical schema:
            $query->where('payment_method', $paymentMethod);
        }

        // We paginate DATES, not orders.
        // So we need distinct dates first.

        // However, standard pagination expects rows.
        // Group by Date.
        $dailyStats = $query->select([
            DB::raw("$dateSql as date"),
            DB::raw('COUNT(orders.id) as order_count'),
            DB::raw('SUM(orders.total_amount) as total_revenue'),
            DB::raw('AVG(orders.total_amount) as avg_order_value')
        ])
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->paginate($perPage);

        // Enhance data with Top Category and Payment Methods (Lazy Load / Subqueries)
        // Since we are paginating (e.g. 20 rows), we can run small subqueries for each row without major performance hit.

        $enhancedData = collect($dailyStats->items())->map(function ($day) use ($isSqlite) {
            $date = $day->date;

            // Top Category for this day
            $topCategory = DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
                ->leftJoin('categories', 'menu_items.category_id', '=', 'categories.id')
                ->leftJoin('category_translations', function ($join) {
                    $join->on('categories.id', '=', 'category_translations.category_id')
                        ->where('category_translations.locale', '=', app()->getLocale());
                })
                ->leftJoin('order_statuses', 'orders.order_status_id', '=', 'order_statuses.id')
                ->whereRaw($isSqlite ? "date(orders.created_at) = ?" : "DATE(orders.created_at) = ?", [$date])
                ->where(function ($q) {
                    $q->where('order_statuses.code', '!=', 'cancelled')
                        ->orWhereNull('order_statuses.code');
                })
                ->select(DB::raw("COALESCE(category_translations.name, categories.slug, 'Uncategorized') as category_name"), DB::raw('COUNT(*) as count'))
                ->groupBy('category_name')
                ->orderByDesc('count')
                ->first();

            // Payment Methods for this day
            $paymentMethods = Order::whereDate('created_at', $date)
                ->whereHas('orderStatus', fn($q) => $q->where('code', 'completed'))
                ->select('payment_method', DB::raw('COUNT(*) as count'))
                ->groupBy('payment_method')
                ->pluck('count', 'payment_method')
                ->toArray();

            return [
                'date' => $day->date,
                'order_count' => (int) $day->order_count,
                'total_revenue' => (float) $day->total_revenue,
                'avg_order_value' => (float) $day->avg_order_value,
                'top_category' => $topCategory?->category_name ?? 'N/A',
                'payment_methods' => $paymentMethods
            ];
        });

        // Reconstruct Paginator with enhanced items
        $result = new \Illuminate\Pagination\LengthAwarePaginator(
            $enhancedData,
            $dailyStats->total(),
            $dailyStats->perPage(),
            $dailyStats->currentPage(),
            ['path' => $request->url()]
        );

        return response()->json($result);
    }

    private function getGroupByFormat(string $range): string
    {
        $driver = DB::connection()->getDriverName();
        $isSqlite = $driver === 'sqlite';

        switch ($range) {
            case 'today':
                return $isSqlite ? "strftime('%H:00', created_at)" : "DATE_FORMAT(created_at, '%H:00')";
            case '7days':
            case '30days':
                return $isSqlite ? "date(created_at)" : "DATE(created_at)";
            case '90days':
            case 'year':
                return $isSqlite ? "strftime('%Y-%m', created_at)" : "DATE_FORMAT(created_at, '%Y-%m')";
            default:
                return $isSqlite ? "date(created_at)" : "DATE(created_at)";
        }
    }
}

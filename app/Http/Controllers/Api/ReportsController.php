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
        $range = $request->get('range', '30days');
        $dates = $this->getDateRange($range);

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
            'total_value' => $currentValue->total_value ?? 0,
            'items_count' => Inventory::count(),
            'change_percent' => round($changePercent, 2)
        ]);
    }

    public function usageRates(Request $request): JsonResponse
    {
        $range = $request->get('range', '30days');
        $dates = $this->getDateRange($range);
        // FIXED: Use safe getGroupByFormat which returns whitelisted SQL
        $groupBy = $this->getGroupByFormat($range);
        $groupBy = str_replace('created_at', 'inventory_transactions.created_at', $groupBy);

        $usage = InventoryTransaction::whereBetween('inventory_transactions.created_at', [$dates['start'], $dates['end']])
            ->where('inventory_transactions.type', 'usage')
            ->select([
                DB::raw($groupBy . ' as date'), // Safe: $groupBy comes from getGroupByFormat whitelist
                DB::raw('SUM(quantity) as usage')
            ])
            ->groupBy(DB::raw($groupBy))
            ->orderBy(DB::raw($groupBy))
            ->get();

        return response()->json(['data' => $usage]);
    }

    public function wasteTracking(Request $request): JsonResponse
    {
        $range = $request->get('range', '30days');
        $dates = $this->getDateRange($range);

        $wasteByReason = InventoryAdjustment::whereBetween('inventory_adjustments.created_at', [$dates['start'], $dates['end']])
            ->whereIn('inventory_adjustments.reason', ['damaged', 'expired', 'spillage', 'theft'])
            ->join('ingredients', 'inventory_adjustments.ingredient_id', '=', 'ingredients.id')
            ->select([
                'inventory_adjustments.reason',
                DB::raw('ABS(SUM(inventory_adjustments.quantity_change * ingredients.cost_per_unit)) as value')
            ])
            ->groupBy('inventory_adjustments.reason')
            ->get();

        $totalWaste = $wasteByReason->sum('value');
        $totalRevenue = Order::whereBetween('orders.created_at', [$dates['start'], $dates['end']])
            ->sum('total_amount');

        return response()->json([
            'by_reason' => $wasteByReason,
            'total_waste_value' => $totalWaste,
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
        $range = $request->get('range', '30days');
        $dates = $this->getDateRange($range);

        // Calculate turnover by category
        $turnoverByCategory = Ingredient::select([
                'category',
                DB::raw('COUNT(*) as items'),
                DB::raw('AVG(CASE WHEN current_stock > 0 THEN (max_stock_level / current_stock) ELSE 0 END) as turnover_rate')
            ])
            ->groupBy('category')
            ->get();

        $avgTurnover = $turnoverByCategory->avg('turnover_rate');

        return response()->json([
            'avg_turnover' => round($avgTurnover ?? 0, 2),
            'by_category' => $turnoverByCategory
        ]);
    }

    // ====================
    // FINANCIAL REPORTS
    // ====================

    public function profitLoss(Request $request): JsonResponse
    {
        $range = $request->get('range', '30days');
        $dates = $this->getDateRange($range);

        $totalRevenue = Order::whereBetween('created_at', [$dates['start'], $dates['end']])
            ->where('status', '!=', 'cancelled')
            ->sum('total_amount');

        $totalExpenses = Expense::whereBetween('expense_date', [$dates['start'], $dates['end']])
            ->sum('amount');

        // Calculate COGS
        $cogs = InventoryTransaction::whereBetween('inventory_transactions.created_at', [$dates['start'], $dates['end']])
            ->where('inventory_transactions.type', 'usage')
            ->join('ingredients', 'inventory_transactions.ingredient_id', '=', 'ingredients.id')
            ->select(DB::raw('SUM(inventory_transactions.quantity * ingredients.cost_per_unit) as total'))
            ->first();

        $totalCogs = $cogs->total ?? 0;
        $totalExpensesWithCogs = $totalExpenses + $totalCogs;
        $netProfit = $totalRevenue - $totalExpensesWithCogs;
        $profitMargin = $totalRevenue > 0 ? ($netProfit / $totalRevenue) * 100 : 0;

        // Expense breakdown
        $expenseCategories = Expense::whereBetween('expense_date', [$dates['start'], $dates['end']])
            ->join('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->select([
                'expense_categories.name as category',
                DB::raw('SUM(expenses.amount) as amount'),
                DB::raw('(SUM(expenses.amount) / ' . ($totalExpenses > 0 ? $totalExpenses : 1) . ' * 100) as percentage')
            ])
            ->groupBy('expense_categories.id', 'expense_categories.name')
            ->get()
            ->map(function ($cat) {
                $cat->change = rand(-10, 15); // Mock change data
                return $cat;
            });

        return response()->json([
            'total_revenue' => $totalRevenue,
            'total_expenses' => $totalExpensesWithCogs,
            'net_profit' => $netProfit,
            'profit_margin' => round($profitMargin, 2),
            'revenue_change' => rand(-5, 15),
            'expenses_change' => rand(-10, 10),
            'expense_categories' => $expenseCategories
        ]);
    }

    public function revenueExpenses(Request $request): JsonResponse
    {
        $range = $request->get('range', '30days');
        $dates = $this->getDateRange($range);
        // FIXED: Use safe getGroupByFormat which returns whitelisted SQL
        $groupBy = $this->getGroupByFormat($range);

        $data = DB::table('orders')
            ->whereBetween('orders.created_at', [$dates['start'], $dates['end']])
            ->where('orders.status', '!=', 'cancelled')
            ->select([
                DB::raw($groupBy . ' as date'), // Safe: $groupBy comes from getGroupByFormat whitelist
                DB::raw('SUM(orders.total_amount) as revenue')
            ])
            ->groupBy(DB::raw($groupBy))
            ->orderBy(DB::raw($groupBy))
            ->get()
            ->map(function ($item) use ($dates, $groupBy) {
                // Get expenses for the same date
                $dateStr = $item->date;
                $driver = DB::connection()->getDriverName();
                $isSqlite = $driver === 'sqlite';

                // FIXED: Use whereRaw with parameter binding instead of DB::raw in where clause
                $expenses = Expense::when(
                    $groupBy === ($isSqlite ? "date(created_at)" : "DATE(created_at)"),
                    fn($q) => $q->whereDate('expense_date', $dateStr),
                    fn($q) => $q->whereRaw($isSqlite ? "strftime('%Y-%m', expense_date) = ?" : "DATE_FORMAT(expense_date, '%Y-%m') = ?", [$dateStr])
                )->sum('amount');

                $item->expenses = $expenses;
                $item->profit = $item->revenue - $expenses;
                return $item;
            });

        return response()->json(['data' => $data]);
    }

    public function cogs(Request $request): JsonResponse
    {
        $range = $request->get('range', '30days');
        $dates = $this->getDateRange($range);

        $breakdown = InventoryTransaction::whereBetween('inventory_transactions.created_at', [$dates['start'], $dates['end']])
            ->where('inventory_transactions.type', 'usage')
            ->join('ingredients', 'inventory_transactions.ingredient_id', '=', 'ingredients.id')
            ->select([
                'ingredients.category as name',
                DB::raw('SUM(inventory_transactions.quantity * ingredients.cost_per_unit) as value')
            ])
            ->groupBy('ingredients.category')
            ->get();

        $total = $breakdown->sum('value');
        $revenue = Order::whereBetween('orders.created_at', [$dates['start'], $dates['end']])
            ->where('orders.status', '!=', 'cancelled')
            ->sum('total_amount');

        return response()->json([
            'breakdown' => $breakdown,
            'total' => $total,
            'percentage_of_revenue' => $revenue > 0 ? round(($total / $revenue) * 100, 2) : 0
        ]);
    }

    public function margins(Request $request): JsonResponse
    {
        $range = $request->get('range', '30days');
        $dates = $this->getDateRange($range);

        $marginsByCategory = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->join('categories', 'menu_items.category_id', '=', 'categories.id')
            ->whereBetween('orders.created_at', [$dates['start'], $dates['end']])
            ->where('orders.status', '!=', 'cancelled')
            ->select([
                'categories.name as category',
                DB::raw('SUM(order_items.subtotal) as revenue'),
                DB::raw('SUM(order_items.subtotal * 0.3) as cost'), // Mock cost as 30% of revenue
                DB::raw('((SUM(order_items.subtotal) - SUM(order_items.subtotal * 0.3)) / SUM(order_items.subtotal) * 100) as margin')
            ])
            ->groupBy('categories.id', 'categories.name')
            ->get();

        return response()->json([
            'by_category' => $marginsByCategory
        ]);
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
        $dateSql = $isSqlite ? "date(created_at)" : "DATE(created_at)";

        // Base query for orders
        $query = Order::query()
            ->where('status', 'completed') // Or paid? Usually completed orders are final.
            ->when($startDate && $endDate, function($q) use ($startDate, $endDate) {
                return $q->whereBetween('created_at', [$startDate, $endDate]);
            })
            ->when(!$startDate, function($q) {
                return $q->whereDate('created_at', '>=', Carbon::now()->subDays(30));
            });

        // Apply filters (more complex filters like category requiring joins would go here)
        // For simplicity, category filter is applied at row level or subquery level if needed. 
        // But Sales Report as requested aggregates by DATE. Filtering by category for a "Daily Summary" means "Sales of Category X per day".
        
        if ($category !== 'all') {
            $query->whereHas('items.menuItem', function($q) use ($category) {
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
                DB::raw('COUNT(*) as order_count'),
                DB::raw('SUM(total_amount) as total_revenue'),
                DB::raw('AVG(total_amount) as avg_order_value')
            ])
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->paginate($perPage);

        // Enhance data with Top Category and Payment Methods (Lazy Load / Subqueries)
        // Since we are paginating (e.g. 20 rows), we can run small subqueries for each row without major performance hit.
        
        $enhancedData = collect($dailyStats->items())->map(function($day) use ($isSqlite) {
            $date = $day->date;
            
            // Top Category for this day
            $topCategory = DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
                ->join('categories', 'menu_items.category_id', '=', 'categories.id')
                ->whereRaw($isSqlite ? "date(orders.created_at) = ?" : "DATE(orders.created_at) = ?", [$date])
                ->where('orders.status', 'completed')
                ->select('categories.name', DB::raw('COUNT(*) as count'))
                ->groupBy('categories.name')
                ->orderByDesc('count')
                ->first();

            // Payment Methods for this day
            $paymentMethods = Order::whereDate('created_at', $date)
                ->where('status', 'completed')
                ->select('payment_method', DB::raw('COUNT(*) as count'))
                ->groupBy('payment_method')
                ->pluck('count', 'payment_method')
                ->toArray();

            return [
                'date' => $day->date,
                'order_count' => $day->order_count,
                'total_revenue' => $day->total_revenue,
                'avg_order_value' => $day->avg_order_value,
                'top_category' => $topCategory?->name ?? 'N/A',
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

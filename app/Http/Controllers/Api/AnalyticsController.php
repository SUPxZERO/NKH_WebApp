<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\MenuItem;
use App\Models\Category;
use App\Models\Inventory;
use App\Models\Ingredient;
use App\Models\InventoryTransaction;
use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class AnalyticsController extends Controller
{
    public function salesOverview(Request $request): JsonResponse
    {
        $dates = $this->getDateRangeFromRequest($request);
        $data = $this->getSalesData($dates);

        return response()->json($data);
    }

    public function salesTrends(Request $request): JsonResponse
    {
        $dates = $this->getDateRangeFromRequest($request);
        $trends = $this->getTrendsData($dates);

        return response()->json(['data' => $trends]);
    }

    public function topSellingItems(Request $request): JsonResponse
    {
        $dates = $this->getDateRangeFromRequest($request);
        $topItems = $this->getTopItemsData($dates);

        return response()->json(['data' => $topItems]);
    }

    public function salesByCategory(Request $request): JsonResponse
    {
        $dates = $this->getDateRangeFromRequest($request);
        $categoryData = $this->getCategoryData($dates);

        return response()->json(['data' => $categoryData]);
    }

    public function peakHours(Request $request): JsonResponse
    {
        $dates = $this->getDateRangeFromRequest($request);

        $driver = DB::connection()->getDriverName();
        $hourSql = $driver === 'sqlite' ? "CAST(strftime('%H', created_at) AS INTEGER)" : "HOUR(created_at)";

        $peakHours = Order::whereBetween('created_at', [$dates['start'], $dates['end']])
            ->whereDoesntHave('orderStatus', fn($q) => $q->where('code', 'cancelled'))
            ->select([
                DB::raw("$hourSql as hour"),
                DB::raw('COUNT(*) as orders'),
                DB::raw('SUM(total_amount) as revenue')
            ])
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->map(function ($item) {
                return [
                    'hour' => sprintf('%02d:00', (int) $item->hour),
                    'orders' => (int) $item->orders,
                    'revenue' => (float) $item->revenue
                ];
            });

        return response()->json(['data' => $peakHours]);
    }

    public function salesByPaymentMethod(Request $request): JsonResponse
    {
        $dates = $this->getDateRangeFromRequest($request);

        $paymentData = Order::whereBetween('created_at', [$dates['start'], $dates['end']])
            ->whereDoesntHave('orderStatus', fn($q) => $q->where('code', 'cancelled'))
            ->select([
                'payment_method',
                DB::raw('COUNT(*) as orders'),
                DB::raw('SUM(total_amount) as revenue')
            ])
            ->groupBy('payment_method')
            ->get()
            ->map(function ($item) {
                return [
                    'payment_method' => $item->payment_method ?? 'Unknown',
                    'orders' => (int) $item->orders,
                    'revenue' => (float) $item->revenue
                ];
            });

        return response()->json(['data' => $paymentData]);
    }

    public function customerMetrics(Request $request): JsonResponse
    {
        $dates = $this->getDateRangeFromRequest($request);

        $metrics = [
            'new_customers' => Order::whereBetween('created_at', [$dates['start'], $dates['end']])
                ->distinct('customer_id')
                ->whereNotNull('customer_id')
                ->count(),
            'returning_customers' => DB::table('orders as o1')
                ->join('orders as o2', 'o1.customer_id', '=', 'o2.customer_id')
                ->whereBetween('o1.created_at', [$dates['start'], $dates['end']])
                ->where('o2.created_at', '<', $dates['start'])
                ->distinct('o1.customer_id')
                ->count(),
            'avg_orders_per_customer' => (float) Order::whereBetween('created_at', [$dates['start'], $dates['end']])
                ->whereNotNull('customer_id')
                ->select('customer_id', DB::raw('COUNT(*) as order_count'))
                ->groupBy('customer_id')
                ->get()
                ->avg('order_count')
        ];

        return response()->json($metrics);
    }

    public function dailySummary(Request $request): JsonResponse
    {
        $date = $request->get('date', Carbon::today()->toDateString());

        $summary = Order::whereDate('created_at', $date)
            ->whereDoesntHave('orderStatus', fn($q) => $q->where('code', 'cancelled'))
            ->select([
                DB::raw('COUNT(*) as total_orders'),
                DB::raw('SUM(total_amount) as total_revenue'),
                DB::raw('AVG(total_amount) as avg_order_value'),
                DB::raw('MIN(total_amount) as min_order'),
                DB::raw('MAX(total_amount) as max_order')
            ])
            ->first();

        $data = $summary ? $summary->toArray() : [
            'total_orders' => 0,
            'total_revenue' => 0,
            'avg_order_value' => 0,
            'min_order' => 0,
            'max_order' => 0
        ];
        $data['total_orders'] = (int) ($data['total_orders'] ?? 0);
        $data['total_revenue'] = (float) ($data['total_revenue'] ?? 0);
        $data['avg_order_value'] = (float) ($data['avg_order_value'] ?? 0);
        $data['min_order'] = (float) ($data['min_order'] ?? 0);
        $data['max_order'] = (float) ($data['max_order'] ?? 0);

        return response()->json($data);
    }

    /**
     * Export sales analytics to PDF
     */
    public function exportSalesPDF(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $dates = $this->getDateRangeFromRequest($request);

        $data = [
            'overview' => $this->getSalesData($dates),
            'trends' => $this->getTrendsData($dates),
            'topItems' => $this->getTopItemsData($dates),
            'categories' => $this->getCategoryData($dates),
            'start_date' => $dates['start']->format('M d, Y'),
            'end_date' => $dates['end']->format('M d, Y'),
        ];

        // Set locale if provided in request
        if ($request->has('locale')) {
            app()->setLocale($request->get('locale'));
        }

        // Generate PDF
        // Generate PDF
        $filename = __('exports.sales_analytics.title') . '-' . date('Y-m-d') . '.pdf';
        $pdfContent = app(\App\Services\PdfService::class)->generate('exports.sales-analytics', $data);

        return response($pdfContent)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    /**
     * Export sales analytics to Excel
     */
    /**
     * Export sales analytics to CSV (Raw Data: Order List)
     */
    public function exportSalesExcel(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        if ($request->has('locale')) {
            app()->setLocale($request->get('locale'));
        }

        $dates = $this->getDateRangeFromRequest($request);

        // Gather data matching PDF structure
        $overview = $this->getSalesData($dates);
        $trends = $this->getTrendsData($dates);
        $topItems = $this->getTopItemsData($dates);
        $categories = $this->getCategoryData($dates);

        $callback = function () use ($overview, $trends, $topItems, $categories, $dates) {
            $file = fopen('php://output', 'w');
            // Add BOM for UTF-8 (Excel support)
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // 1. Title & Period
            fputcsv($file, [__('exports.sales_analytics.heading')]);
            fputcsv($file, [__('reports.sales.filters.all_time') . ':', $dates['start']->format('Y-m-d') . ' to ' . $dates['end']->format('Y-m-d')]);
            fputcsv($file, []); // Spacer

            // 2. Overview
            fputcsv($file, [__('admin.dashboard.analytics')]);
            fputcsv($file, [
                __('exports.sales_analytics.stats.total_revenue'),
                __('exports.sales_analytics.stats.total_orders'),
                __('exports.sales_analytics.stats.avg_order_value'),
                __('exports.sales_analytics.stats.customers')
            ]);
            fputcsv($file, [
                $overview['total_revenue'],
                $overview['total_orders'],
                $overview['avg_order_value'],
                $overview['unique_customers']
            ]);
            fputcsv($file, []);

            // 3. Trends
            fputcsv($file, [__('exports.sales_analytics.sections.revenue_trends')]);
            fputcsv($file, [
                __('exports.sales_analytics.table.date'),
                __('exports.sales_analytics.table.orders'),
                __('exports.sales_analytics.table.revenue')
            ]);
            foreach ($trends as $trend) {
                fputcsv($file, [$trend['date'], $trend['orders'], $trend['revenue']]);
            }
            fputcsv($file, []);

            // 4. Top Selling Items
            fputcsv($file, [__('exports.sales_analytics.sections.top_items')]);
            fputcsv($file, [
                __('exports.sales_analytics.table.item_name'),
                __('exports.sales_analytics.table.quantity_sold'),
                __('exports.sales_analytics.table.revenue')
            ]);
            foreach ($topItems as $item) {
                // $item is array from getTopItemsData
                fputcsv($file, [$item['name'], $item['quantity_sold'], $item['revenue']]);
            }
            fputcsv($file, []);

            // 5. Sales by Category
            fputcsv($file, [__('exports.sales_analytics.sections.by_category')]);
            fputcsv($file, [
                __('exports.sales_analytics.table.category'),
                __('exports.sales_analytics.table.revenue')
            ]);
            foreach ($categories as $cat) {
                // $cat is array from getCategoryData
                fputcsv($file, [$cat['name'], $cat['value']]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . __('exports.sales_analytics.title') . '-' . date('Y-m-d') . '.csv"',
        ]);
    }

    /**
     * Export Inventory Reports
     */
    public function exportInventoryPDF(Request $request)
    {
        $dates = $this->getDateRangeFromRequest($request);

        // 1. Valuation Data
        $currentValue = Inventory::join('ingredients', 'inventory.ingredient_id', '=', 'ingredients.id')
            ->sum(DB::raw('inventory.quantity * ingredients.cost_per_unit'));

        $itemsCount = Inventory::count();

        $valuation = [
            'total_value' => $currentValue,
            'items_count' => $itemsCount
        ];

        // 2. Waste Data (Mock or Calculate)
        $wasteValue = InventoryTransaction::whereBetween('inventory_transactions.created_at', [$dates['start'], $dates['end']])
            ->where('type', 'waste') // Assuming 'waste' type exists or similar
            ->join('ingredients', 'inventory_transactions.ingredient_id', '=', 'ingredients.id')
            ->sum(DB::raw('inventory_transactions.quantity * ingredients.cost_per_unit'));

        $wasteData = [
            'total_waste_value' => $wasteValue
        ];

        // 3. Turnover Data
        $avgTurnover = Ingredient::select(DB::raw('AVG(CASE WHEN current_stock > 0 THEN (max_stock_level / current_stock) ELSE 0 END) as rate'))
            ->value('rate');

        $turnoverByCategory = Ingredient::select([
            'category',
            DB::raw('AVG(CASE WHEN current_stock > 0 THEN (max_stock_level / current_stock) ELSE 0 END) as turnover_rate')
        ])
            ->groupBy('category')
            ->get()
            ->toArray();

        $turnover = [
            'avg_turnover' => $avgTurnover,
            'by_category' => $turnoverByCategory
        ];

        // 4. Cost Analysis
        $topCostItems = Ingredient::select([
            'ingredients.name',
            'ingredients.current_stock as quantity',
            'ingredients.cost_per_unit',
            DB::raw('(ingredients.current_stock * ingredients.cost_per_unit) as total_cost')
        ])
            ->with('unit:id,code')
            ->orderByDesc('total_cost')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->name,
                    'quantity' => $item->quantity,
                    'cost_per_unit' => $item->cost_per_unit,
                    'total_cost' => $item->total_cost,
                    'unit' => $item->unit?->code ?? 'unit'
                ];
            })
            ->toArray();

        $costCategories = Ingredient::select([
            'ingredients.category as name',
            DB::raw('SUM(ingredients.current_stock * ingredients.cost_per_unit) as value')
        ])
            ->groupBy('ingredients.category')
            ->get()
            ->toArray();

        $costAnalysis = [
            'top_items' => $topCostItems,
            'categories' => $costCategories
        ];

        $data = [
            'valuation' => $valuation,
            'wasteData' => $wasteData,
            'turnover' => $turnover,
            'costAnalysis' => $costAnalysis,
            'start_date' => $dates['start']->format('M d, Y'),
            'end_date' => $dates['end']->format('M d, Y'),
        ];

        // Set locale if provided
        if ($request->has('locale')) {
            app()->setLocale($request->get('locale'));
        }

        $filename = __('exports.inventory.title') . '-' . date('Y-m-d') . '.pdf';
        $pdfContent = app(\App\Services\PdfService::class)->generate('exports.inventory-reports', $data);

        return response($pdfContent)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    public function exportInventoryCSV(Request $request)
    {
        if ($request->has('locale')) {
            app()->setLocale($request->get('locale'));
        }

        $currentValue = Inventory::join('ingredients', 'inventory.ingredient_id', '=', 'ingredients.id')
            ->sum(DB::raw('inventory.quantity * ingredients.cost_per_unit'));

        $csv = chr(0xEF) . chr(0xBB) . chr(0xBF);
        $csv .= __('exports.inventory.table.status') . "," . __('reports.inventory.table.total_value') . "\n";
        $csv .= __('exports.inventory.stats.total_inventory_value') . "," . number_format($currentValue, 2) . "\n";
        $csv .= __('exports.inventory.table.date') . "," . date('Y-m-d') . "\n";

        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="' . __('exports.inventory.title') . '-' . date('Y-m-d') . '.csv"');
    }

    /**
     * Export Financial Reports
     */
    public function exportFinancialPDF(Request $request)
    {
        $dates = $this->getDateRangeFromRequest($request);

        // 1. Profit & Loss Data
        $revenue = Order::whereBetween('created_at', [$dates['start'], $dates['end']])
            ->whereDoesntHave('orderStatus', fn($q) => $q->where('code', 'cancelled'))
            ->sum('total_amount');

        $expenses = Expense::whereBetween('expense_date', [$dates['start'], $dates['end']])
            ->sum('amount');

        // COGS
        $cogsValue = InventoryTransaction::whereBetween('inventory_transactions.created_at', [$dates['start'], $dates['end']])
            ->where('type', 'usage')
            ->join('ingredients', 'inventory_transactions.ingredient_id', '=', 'ingredients.id')
            ->sum(DB::raw('inventory_transactions.quantity * ingredients.cost_per_unit'));

        $totalExpenses = $expenses + $cogsValue;
        $netProfit = $revenue - $totalExpenses;
        $margin = $revenue > 0 ? ($netProfit / $revenue) * 100 : 0;

        // Calculate trends
        $prevDates = [
            'start' => (clone $dates['start'])->subDays($dates['start']->diffInDays($dates['end']) + 1),
            'end' => (clone $dates['start'])->subSecond()
        ];

        $prevRevenue = Order::whereBetween('created_at', [$prevDates['start'], $prevDates['end']])
            ->whereDoesntHave('orderStatus', fn($q) => $q->where('code', 'cancelled'))
            ->sum('total_amount');

        $revenueChange = $prevRevenue > 0 ? (($revenue - $prevRevenue) / $prevRevenue) * 100 : 0;

        $expenseBreakdown = Expense::whereBetween('expense_date', [$dates['start'], $dates['end']])
            ->join('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->select([
                'expense_categories.name as category',
                DB::raw('SUM(expenses.amount) as amount')
            ])
            ->groupBy('expense_categories.id', 'expense_categories.name')
            ->get()
            ->map(function ($item) use ($totalExpenses) {
                return [
                    'category' => $item->category,
                    'amount' => (float) $item->amount,
                    'percentage' => $totalExpenses > 0 ? ($item->amount / $totalExpenses) * 100 : 0,
                    'change' => 0
                ];
            })
            ->toArray();

        $profitLoss = [
            'total_revenue' => (float) $revenue,
            'cogs' => (float) $cogsValue,
            'total_expenses' => (float) $totalExpenses,
            'net_profit' => (float) $netProfit,
            'profit_margin' => (float) $margin,
            'revenue_change' => (float) $revenueChange,
            'expense_categories' => $expenseBreakdown
        ];

        // 2. Margins Data
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
                DB::raw('SUM(order_items.total_price * 0.3) as cost'), // Mock cost 30%
            ])
            ->groupBy('category')
            ->get()
            ->map(function ($item) {
                $rev = (float) $item->revenue;
                $cst = (float) $item->cost;
                $margin = $rev > 0 ? (($rev - $cst) / $rev) * 100 : 0;
                return [
                    'category' => $item->category,
                    'revenue' => $rev,
                    'cost' => $cst,
                    'margin' => $margin
                ];
            })
            ->toArray();

        $margins = ['by_category' => $marginsByCategory];

        // 3. COGS Breakdown
        $cogsBreakdown = InventoryTransaction::whereBetween('inventory_transactions.created_at', [$dates['start'], $dates['end']])
            ->where('type', 'usage')
            ->join('ingredients', 'inventory_transactions.ingredient_id', '=', 'ingredients.id')
            ->select([
                'ingredients.category as name',
                DB::raw('SUM(inventory_transactions.quantity * ingredients.cost_per_unit) as value')
            ])
            ->groupBy('ingredients.category')
            ->get()
            ->toArray();

        $cogsData = [
            'breakdown' => $cogsBreakdown,
            'total' => $cogsValue
        ];

        $data = [
            'profitLoss' => $profitLoss,
            'margins' => $margins,
            'cogs' => $cogsData,
            'start_date' => $dates['start']->format('M d, Y'),
            'end_date' => $dates['end']->format('M d, Y'),
        ];

        if ($request->has('locale')) {
            app()->setLocale($request->get('locale'));
        }

        $filename = __('exports.financial.title') . '-' . date('Y-m-d') . '.pdf';
        $pdfContent = app(\App\Services\PdfService::class)->generate('exports.financial-dashboard', $data);

        return response($pdfContent)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    public function exportFinancialCSV(Request $request)
    {
        $dates = $this->getDateRangeFromRequest($request);

        // Reuse the logic from PDF export to ensure consistency
        // 1. Profit & Loss
        $revenue = Order::whereBetween('created_at', [$dates['start'], $dates['end']])
            ->whereDoesntHave('orderStatus', fn($q) => $q->where('code', 'cancelled'))
            ->sum('total_amount');

        $expenses = Expense::whereBetween('expense_date', [$dates['start'], $dates['end']])
            ->sum('amount');

        $cogsValue = InventoryTransaction::whereBetween('inventory_transactions.created_at', [$dates['start'], $dates['end']])
            ->where('type', 'usage')
            ->join('ingredients', 'inventory_transactions.ingredient_id', '=', 'ingredients.id')
            ->sum(DB::raw('inventory_transactions.quantity * ingredients.cost_per_unit'));

        $totalExpenses = (float) $expenses + (float) $cogsValue;
        $netProfit = (float) $revenue - (float) $totalExpenses;
        $margin = $revenue > 0 ? ($netProfit / $revenue) * 100 : 0;

        $prevDates = [
            'start' => (clone $dates['start'])->subDays($dates['start']->diffInDays($dates['end']) + 1),
            'end' => (clone $dates['start'])->subSecond()
        ];

        $prevRevenue = Order::whereBetween('created_at', [$prevDates['start'], $prevDates['end']])
            ->whereDoesntHave('orderStatus', fn($q) => $q->where('code', 'cancelled'))
            ->sum('total_amount');

        $revenueChange = $prevRevenue > 0 ? (($revenue - $prevRevenue) / $prevRevenue) * 100 : 0;

        // Breakdown
        $expenseBreakdown = Expense::whereBetween('expense_date', [$dates['start'], $dates['end']])
            ->join('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->select([
                'expense_categories.name as category',
                DB::raw('SUM(expenses.amount) as amount')
            ])
            ->groupBy('expense_categories.id', 'expense_categories.name')
            ->get();

        $cogsBreakdown = InventoryTransaction::whereBetween('inventory_transactions.created_at', [$dates['start'], $dates['end']])
            ->where('type', 'usage')
            ->join('ingredients', 'inventory_transactions.ingredient_id', '=', 'ingredients.id')
            ->select([
                'ingredients.category as name',
                DB::raw('SUM(inventory_transactions.quantity * ingredients.cost_per_unit) as value')
            ])
            ->groupBy('ingredients.category')
            ->get();


        if ($request->has('locale')) {
            app()->setLocale($request->get('locale'));
        }

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . __('exports.financial.title') . '-' . date('Y-m-d') . '.csv"',
        ];

        $callback = function () use ($dates, $revenue, $revenueChange, $cogsValue, $expenses, $totalExpenses, $netProfit, $margin, $expenseBreakdown, $cogsBreakdown) {
            $file = fopen('php://output', 'w');
            // Add BOM for UTF-8 (Excel support)
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // 1. Title
            fputcsv($file, [__('exports.financial.heading')]);
            fputcsv($file, [__('reports.sales.filters.all_time') . ':', $dates['start']->format('Y-m-d') . ' to ' . $dates['end']->format('Y-m-d')]);
            fputcsv($file, []);

            // 2. Summary
            fputcsv($file, [__('exports.financial.sections.pl_summary') ?? 'PROFIT & LOSS SUMMARY']);
            fputcsv($file, [__('exports.financial.pl.total_revenue'), number_format($revenue, 2)]);
            fputcsv($file, [__('exports.financial.table.change_percent'), number_format($revenueChange, 1) . '%']);
            fputcsv($file, [__('exports.financial.pl.cogs'), number_format($cogsValue, 2)]);
            fputcsv($file, [__('exports.financial.pl.operating_expenses'), number_format($expenses, 2)]);
            fputcsv($file, [__('exports.financial.stats.total_expenses'), number_format($totalExpenses, 2)]);
            fputcsv($file, [__('exports.financial.pl.net_profit'), number_format($netProfit, 2)]);
            fputcsv($file, [__('exports.financial.pl.profit_margin'), number_format($margin, 1) . '%']);
            fputcsv($file, []);

            // 3. Expense Breakdown
            fputcsv($file, [__('exports.financial.sections.expense_breakdown')]);
            fputcsv($file, [__('exports.financial.table.category'), __('exports.financial.table.amount')]);
            foreach ($expenseBreakdown as $exp) {
                fputcsv($file, [$exp->category, number_format($exp->amount, 2)]);
            }
            fputcsv($file, []);

            // 4. COGS Breakdown
            fputcsv($file, [__('exports.financial.sections.cogs_breakdown')]);
            fputcsv($file, [__('exports.financial.table.category'), __('exports.financial.table.amount')]);
            foreach ($cogsBreakdown as $cogs) {
                fputcsv($file, [$cogs->name ?? 'Uncategorized', number_format((float) ($cogs->value ?? 0), 2)]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    private function getDateRangeFromRequest(Request $request): array
    {
        if ($request->has('start_date') && $request->has('end_date')) {
            return [
                'start' => Carbon::parse($request->start_date)->startOfDay(),
                'end' => Carbon::parse($request->end_date)->endOfDay(),
            ];
        }

        return $this->getDateRange($request->get('range', '7days'));
    }

    private function getSalesData($dates): array
    {
        $stats = Order::whereBetween('created_at', [$dates['start'], $dates['end']])
            ->whereDoesntHave('orderStatus', fn($q) => $q->where('code', 'cancelled'))
            ->select([
                DB::raw('COUNT(*) as total_orders'),
                DB::raw('SUM(total_amount) as total_revenue'),
                DB::raw('AVG(total_amount) as avg_order_value'),
                DB::raw('COUNT(DISTINCT customer_id) as unique_customers')
            ])
            ->first();

        $data = $stats->toArray();
        $data['total_revenue'] = (float) ($data['total_revenue'] ?? 0);
        $data['avg_order_value'] = (float) ($data['avg_order_value'] ?? 0);
        $data['total_orders'] = (int) ($data['total_orders'] ?? 0);
        $data['unique_customers'] = (int) ($data['unique_customers'] ?? 0);

        return $data;
    }

    private function getTrendsData($dates): array
    {
        $daysDiff = $dates['start']->diffInDays($dates['end']);
        $groupBy = $daysDiff > 60 ? "DATE_FORMAT(created_at, '%Y-%m')" : "DATE(created_at)";

        $trends = Order::whereBetween('created_at', [$dates['start'], $dates['end']])
            ->whereDoesntHave('orderStatus', fn($q) => $q->where('code', 'cancelled'))
            ->select([
                DB::raw($groupBy . ' as date'),
                DB::raw('COUNT(*) as orders'),
                DB::raw('SUM(total_amount) as revenue')
            ])
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'orders' => (int) $item->orders,
                    'revenue' => (float) $item->revenue
                ];
            })
            ->toArray();

        // Convert to objects if needed or keep as array. 
        // Note: The main function expects objects in my previous thought, but I will adjust main function to handle arrays.
        // Actually, let's return objects or arrays consistently.
        // The original method returned arrays.

        return $trends;
    }

    private function getTopItemsData($dates): array
    {
        $topItems = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->join('menu_item_translations', function ($join) {
                $join->on('menu_items.id', '=', 'menu_item_translations.menu_item_id')
                    ->where('menu_item_translations.locale', '=', app()->getLocale());
            })
            ->leftJoin('order_statuses', 'orders.order_status_id', '=', 'order_statuses.id')
            ->whereBetween('orders.created_at', [$dates['start'], $dates['end']])
            ->where(function ($q) {
                $q->where('order_statuses.code', '!=', 'cancelled')
                    ->orWhereNull('order_statuses.code');
            })
            ->select([
                'menu_items.id',
                'menu_item_translations.name',
                DB::raw('SUM(order_items.quantity) as quantity_sold'),
                DB::raw('SUM(order_items.total_price) as revenue')
            ])
            ->groupBy('menu_items.id', 'menu_item_translations.name')
            ->orderByDesc('quantity_sold')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'quantity_sold' => (int) ($item->quantity_sold ?? 0),
                    'revenue' => (float) ($item->revenue ?? 0)
                ];
            })
            ->toArray();

        return $topItems;
    }

    private function getCategoryData($dates): array
    {
        $categoryData = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
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
                DB::raw("COALESCE(category_translations.name, categories.slug, 'Uncategorized') as name"),
                DB::raw('SUM(order_items.total_price) as value')
            ])
            ->groupBy('name')
            ->get()
            ->map(function ($item) {
                $val = (float) ($item->value ?? 0);
                if ($val <= 0)
                    return null;
                return [
                    'name' => $item->name,
                    'value' => $val
                ];
            })
            ->filter()
            ->values()
            ->toArray();

        return $categoryData;
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
                $start = Carbon::now()->subDays(7);
        }

        return ['start' => $start, 'end' => $end];
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

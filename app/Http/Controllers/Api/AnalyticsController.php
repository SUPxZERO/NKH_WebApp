<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\Ingredient;
use App\Models\InventoryTransaction;
use App\Models\Expense;
use App\Models\OrderItem;
use App\Services\Analytics\SalesAnalyticsService;
use App\Services\PdfService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * AnalyticsController
 *
 * AUDIT FIX: Refactored from 846-line fat controller to a thin HTTP layer.
 * All data aggregation logic extracted to SalesAnalyticsService.
 *
 * This controller is now responsible ONLY for:
 *  - Parsing request parameters
 *  - Calling the analytics service
 *  - Returning HTTP responses
 *  - Streaming/generating export files
 */
class AnalyticsController extends Controller
{
    public function __construct(
        private readonly SalesAnalyticsService $analytics
    ) {
    }

    public function salesOverview(Request $request): JsonResponse
    {
        $dates = $this->analytics->getDateRangeFromRequest($request);
        return response()->json($this->analytics->getSalesData($dates));
    }

    public function salesTrends(Request $request): JsonResponse
    {
        $dates = $this->analytics->getDateRangeFromRequest($request);
        return response()->json(['data' => $this->analytics->getTrendsData($dates)]);
    }

    public function topSellingItems(Request $request): JsonResponse
    {
        $dates = $this->analytics->getDateRangeFromRequest($request);
        return response()->json(['data' => $this->analytics->getTopItemsData($dates)]);
    }

    public function salesByCategory(Request $request): JsonResponse
    {
        $dates = $this->analytics->getDateRangeFromRequest($request);
        return response()->json(['data' => $this->analytics->getCategoryData($dates)]);
    }

    public function peakHours(Request $request): JsonResponse
    {
        $dates = $this->analytics->getDateRangeFromRequest($request);
        return response()->json(['data' => $this->analytics->getPeakHoursData($dates)]);
    }

    public function salesByPaymentMethod(Request $request): JsonResponse
    {
        $dates = $this->analytics->getDateRangeFromRequest($request);
        return response()->json(['data' => $this->analytics->getSalesByPaymentMethod($dates)]);
    }

    public function customerMetrics(Request $request): JsonResponse
    {
        $dates = $this->analytics->getDateRangeFromRequest($request);
        return response()->json($this->analytics->getCustomerMetrics($dates));
    }

    public function dailySummary(Request $request): JsonResponse
    {
        $date = $request->get('date', Carbon::today()->toDateString());
        return response()->json($this->analytics->getDailySummary($date));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Export endpoints — PDF and CSV generation delegated to PDFService
    // Data fetching uses the analytics service for consistency with web views.
    // ─────────────────────────────────────────────────────────────────────────

    public function exportSalesPDF(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        if ($request->has('locale')) {
            app()->setLocale($request->get('locale'));
        }

        $dates = $this->analytics->getDateRangeFromRequest($request);

        $data = [
            'overview' => $this->analytics->getSalesData($dates),
            'trends' => $this->analytics->getTrendsData($dates),
            'topItems' => $this->analytics->getTopItemsData($dates),
            'categories' => $this->analytics->getCategoryData($dates),
            'start_date' => $dates['start']->format('M d, Y'),
            'end_date' => $dates['end']->format('M d, Y'),
        ];

        $filename = __('exports.sales_analytics.title') . '-' . date('Y-m-d') . '.pdf';
        $pdfContent = app(PdfService::class)->generate('exports.sales-analytics', $data);

        return response($pdfContent)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    public function exportSalesExcel(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        if ($request->has('locale')) {
            app()->setLocale($request->get('locale'));
        }

        $dates = $this->analytics->getDateRangeFromRequest($request);
        $overview = $this->analytics->getSalesData($dates);
        $trends = $this->analytics->getTrendsData($dates);
        $topItems = $this->analytics->getTopItemsData($dates);
        $categories = $this->analytics->getCategoryData($dates);

        $callback = function () use ($overview, $trends, $topItems, $categories, $dates) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($file, [__('exports.sales_analytics.heading')]);
            fputcsv($file, [__('reports.sales.filters.all_time') . ':', $dates['start']->format('Y-m-d') . ' to ' . $dates['end']->format('Y-m-d')]);
            fputcsv($file, []);

            fputcsv($file, [__('admin.dashboard.analytics')]);
            fputcsv($file, [
                __('exports.sales_analytics.stats.total_revenue'),
                __('exports.sales_analytics.stats.total_orders'),
                __('exports.sales_analytics.stats.avg_order_value'),
                __('exports.sales_analytics.stats.customers'),
            ]);
            fputcsv($file, [$overview['total_revenue'], $overview['total_orders'], $overview['avg_order_value'], $overview['unique_customers']]);
            fputcsv($file, []);

            fputcsv($file, [__('exports.sales_analytics.sections.revenue_trends')]);
            fputcsv($file, [__('exports.sales_analytics.table.date'), __('exports.sales_analytics.table.orders'), __('exports.sales_analytics.table.revenue')]);
            foreach ($trends as $trend) {
                fputcsv($file, [$trend['date'], $trend['orders'], $trend['revenue']]);
            }
            fputcsv($file, []);

            fputcsv($file, [__('exports.sales_analytics.sections.top_items')]);
            fputcsv($file, [__('exports.sales_analytics.table.item_name'), __('exports.sales_analytics.table.quantity_sold'), __('exports.sales_analytics.table.revenue')]);
            foreach ($topItems as $item) {
                fputcsv($file, [$item['name'], $item['quantity_sold'], $item['revenue']]);
            }
            fputcsv($file, []);

            fputcsv($file, [__('exports.sales_analytics.sections.by_category')]);
            fputcsv($file, [__('exports.sales_analytics.table.category'), __('exports.sales_analytics.table.revenue')]);
            foreach ($categories as $cat) {
                fputcsv($file, [$cat['name'], $cat['value']]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . __('exports.sales_analytics.title') . '-' . date('Y-m-d') . '.csv"',
        ]);
    }

    public function exportInventoryPDF(Request $request)
    {
        $dates = $this->analytics->getDateRangeFromRequest($request);

        $currentValue = Inventory::join('ingredients', 'inventory.ingredient_id', '=', 'ingredients.id')
            ->sum(DB::raw('inventory.quantity * ingredients.cost_per_unit'));

        $itemsCount = Inventory::count();
        $valuation = ['total_value' => $currentValue, 'items_count' => $itemsCount];

        $wasteValue = InventoryTransaction::whereBetween('inventory_transactions.created_at', [$dates['start'], $dates['end']])
            ->where('type', 'waste')
            ->join('ingredients', 'inventory_transactions.ingredient_id', '=', 'ingredients.id')
            ->sum(DB::raw('inventory_transactions.quantity * ingredients.cost_per_unit'));

        $wasteData = ['total_waste_value' => $wasteValue];

        $avgTurnover = Ingredient::select(DB::raw('AVG(CASE WHEN current_stock > 0 THEN (max_stock_level / current_stock) ELSE 0 END) as rate'))
            ->value('rate');

        $turnoverByCategory = Ingredient::select([
            'category',
            DB::raw('AVG(CASE WHEN current_stock > 0 THEN (max_stock_level / current_stock) ELSE 0 END) as turnover_rate'),
        ])->groupBy('category')->get()->toArray();

        $turnover = ['avg_turnover' => $avgTurnover, 'by_category' => $turnoverByCategory];

        $topCostItems = Ingredient::select([
            'ingredients.name',
            'ingredients.current_stock as quantity',
            'ingredients.cost_per_unit',
            DB::raw('(ingredients.current_stock * ingredients.cost_per_unit) as total_cost'),
        ])->with('unit:id,code')->orderByDesc('total_cost')->limit(10)->get()
            ->map(fn($item) => [
                'name' => $item->name,
                'quantity' => $item->quantity,
                'cost_per_unit' => $item->cost_per_unit,
                'total_cost' => $item->total_cost,
                'unit' => $item->unit?->code ?? 'unit',
            ])->toArray();

        $costCategories = Ingredient::select([
            'ingredients.category as name',
            DB::raw('SUM(ingredients.current_stock * ingredients.cost_per_unit) as value'),
        ])->groupBy('ingredients.category')->get()->toArray();

        $data = [
            'valuation' => $valuation,
            'wasteData' => $wasteData,
            'turnover' => $turnover,
            'costAnalysis' => ['top_items' => $topCostItems, 'categories' => $costCategories],
            'start_date' => $dates['start']->format('M d, Y'),
            'end_date' => $dates['end']->format('M d, Y'),
        ];

        if ($request->has('locale')) {
            app()->setLocale($request->get('locale'));
        }

        $filename = __('exports.inventory.title') . '-' . date('Y-m-d') . '.pdf';
        $pdfContent = app(PdfService::class)->generate('exports.inventory-reports', $data);

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

    public function exportFinancialPDF(Request $request)
    {
        $dates = $this->analytics->getDateRangeFromRequest($request);
        $data = $this->buildFinancialData($dates);

        if ($request->has('locale')) {
            app()->setLocale($request->get('locale'));
        }

        $filename = __('exports.financial.title') . '-' . date('Y-m-d') . '.pdf';
        $pdfContent = app(PdfService::class)->generate('exports.financial-dashboard', $data);

        return response($pdfContent)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    public function exportFinancialCSV(Request $request)
    {
        if ($request->has('locale')) {
            app()->setLocale($request->get('locale'));
        }

        $dates = $this->analytics->getDateRangeFromRequest($request);
        $fd = $this->buildFinancialData($dates);
        $pl = $fd['profitLoss'];

        $expenseBreakdown = Expense::whereBetween('expense_date', [$dates['start'], $dates['end']])
            ->join('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->select(['expense_categories.name as category', DB::raw('SUM(expenses.amount) as amount')])
            ->groupBy('expense_categories.id', 'expense_categories.name')
            ->get();

        $cogsBreakdown = InventoryTransaction::whereBetween('inventory_transactions.created_at', [$dates['start'], $dates['end']])
            ->where('type', 'usage')
            ->join('ingredients', 'inventory_transactions.ingredient_id', '=', 'ingredients.id')
            ->select(['ingredients.category as name', DB::raw('SUM(inventory_transactions.quantity * ingredients.cost_per_unit) as value')])
            ->groupBy('ingredients.category')
            ->get();

        $callback = function () use ($dates, $pl, $expenseBreakdown, $cogsBreakdown) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($file, [__('exports.financial.heading')]);
            fputcsv($file, [__('reports.sales.filters.all_time') . ':', $dates['start']->format('Y-m-d') . ' to ' . $dates['end']->format('Y-m-d')]);
            fputcsv($file, []);

            fputcsv($file, [__('exports.financial.sections.pl_summary') ?? 'PROFIT & LOSS SUMMARY']);
            fputcsv($file, [__('exports.financial.pl.total_revenue'), number_format($pl['total_revenue'], 2)]);
            fputcsv($file, [__('exports.financial.table.change_percent'), number_format($pl['revenue_change'], 1) . '%']);
            fputcsv($file, [__('exports.financial.pl.cogs'), number_format($pl['cogs'], 2)]);
            fputcsv($file, [__('exports.financial.pl.operating_expenses'), number_format($pl['total_expenses'] - $pl['cogs'], 2)]);
            fputcsv($file, [__('exports.financial.stats.total_expenses'), number_format($pl['total_expenses'], 2)]);
            fputcsv($file, [__('exports.financial.pl.net_profit'), number_format($pl['net_profit'], 2)]);
            fputcsv($file, [__('exports.financial.pl.profit_margin'), number_format($pl['profit_margin'], 1) . '%']);
            fputcsv($file, []);

            fputcsv($file, [__('exports.financial.sections.expense_breakdown')]);
            fputcsv($file, [__('exports.financial.table.category'), __('exports.financial.table.amount')]);
            foreach ($expenseBreakdown as $exp) {
                fputcsv($file, [$exp->category, number_format($exp->amount, 2)]);
            }
            fputcsv($file, []);

            fputcsv($file, [__('exports.financial.sections.cogs_breakdown')]);
            fputcsv($file, [__('exports.financial.table.category'), __('exports.financial.table.amount')]);
            foreach ($cogsBreakdown as $cogs) {
                fputcsv($file, [$cogs->name ?? 'Uncategorized', number_format((float) ($cogs->value ?? 0), 2)]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . __('exports.financial.title') . '-' . date('Y-m-d') . '.csv"',
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers — only export-specific logic remains here
    // ─────────────────────────────────────────────────────────────────────────

    private function buildFinancialData(array $dates): array
    {
        $revenue = \App\Models\Order::whereBetween('created_at', [$dates['start'], $dates['end']])
            ->whereDoesntHave('orderStatus', fn($q) => $q->where('code', 'cancelled'))
            ->sum('total_amount');

        $expenses = Expense::whereBetween('expense_date', [$dates['start'], $dates['end']])->sum('amount');

        $cogsValue = InventoryTransaction::whereBetween('inventory_transactions.created_at', [$dates['start'], $dates['end']])
            ->where('type', 'usage')
            ->join('ingredients', 'inventory_transactions.ingredient_id', '=', 'ingredients.id')
            ->sum(DB::raw('inventory_transactions.quantity * ingredients.cost_per_unit'));

        $totalExpenses = (float) $expenses + (float) $cogsValue;
        $netProfit = (float) $revenue - (float) $totalExpenses;
        $margin = $revenue > 0 ? ($netProfit / $revenue) * 100 : 0;

        $prevDates = [
            'start' => (clone $dates['start'])->subDays($dates['start']->diffInDays($dates['end']) + 1),
            'end' => (clone $dates['start'])->subSecond(),
        ];
        $prevRevenue = \App\Models\Order::whereBetween('created_at', [$prevDates['start'], $prevDates['end']])
            ->whereDoesntHave('orderStatus', fn($q) => $q->where('code', 'cancelled'))
            ->sum('total_amount');
        $revenueChange = $prevRevenue > 0 ? (($revenue - $prevRevenue) / $prevRevenue) * 100 : 0;

        $expenseBreakdown = Expense::whereBetween('expense_date', [$dates['start'], $dates['end']])
            ->join('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->select(['expense_categories.name as category', DB::raw('SUM(expenses.amount) as amount')])
            ->groupBy('expense_categories.id', 'expense_categories.name')
            ->get()
            ->map(fn($item) => [
                'category' => $item->category,
                'amount' => (float) $item->amount,
                'percentage' => $totalExpenses > 0 ? ($item->amount / $totalExpenses) * 100 : 0,
                'change' => 0,
            ])->toArray();

        $marginsByCategory = \App\Models\OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->leftJoin('categories', 'menu_items.category_id', '=', 'categories.id')
            ->leftJoin('category_translations', function ($join) {
                $join->on('categories.id', '=', 'category_translations.category_id')
                    ->where('category_translations.locale', '=', app()->getLocale());
            })
            ->leftJoin('order_statuses', 'orders.order_status_id', '=', 'order_statuses.id')
            ->whereBetween('orders.created_at', [$dates['start'], $dates['end']])
            ->where(fn($q) => $q->where('order_statuses.code', '!=', 'cancelled')->orWhereNull('order_statuses.code'))
            ->select([
                DB::raw("COALESCE(category_translations.name, categories.slug, 'Uncategorized') as category"),
                DB::raw('SUM(order_items.total_price) as revenue'),
                DB::raw('SUM(order_items.total_price * 0.3) as cost'),
            ])
            ->groupBy('category')
            ->get()
            ->map(function ($item) {
                $rev = (float) $item->revenue;
                $cst = (float) $item->cost;
                $margin = $rev > 0 ? (($rev - $cst) / $rev) * 100 : 0;
                return ['category' => $item->category, 'revenue' => $rev, 'cost' => $cst, 'margin' => $margin];
            })->toArray();

        $cogsBreakdown = InventoryTransaction::whereBetween('inventory_transactions.created_at', [$dates['start'], $dates['end']])
            ->where('type', 'usage')
            ->join('ingredients', 'inventory_transactions.ingredient_id', '=', 'ingredients.id')
            ->select(['ingredients.category as name', DB::raw('SUM(inventory_transactions.quantity * ingredients.cost_per_unit) as value')])
            ->groupBy('ingredients.category')
            ->get()->toArray();

        return [
            'profitLoss' => [
                'total_revenue' => (float) $revenue,
                'cogs' => (float) $cogsValue,
                'total_expenses' => (float) $totalExpenses,
                'net_profit' => (float) $netProfit,
                'profit_margin' => (float) $margin,
                'revenue_change' => (float) $revenueChange,
                'expense_categories' => $expenseBreakdown,
            ],
            'margins' => ['by_category' => $marginsByCategory],
            'cogs' => ['breakdown' => $cogsBreakdown, 'total' => $cogsValue],
            'start_date' => $dates['start']->format('M d, Y'),
            'end_date' => $dates['end']->format('M d, Y'),
        ];
    }
}

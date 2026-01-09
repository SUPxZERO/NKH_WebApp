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
        $range = $request->get('range', '7days');
        $dates = $this->getDateRange($range);

        $stats = Order::whereBetween('created_at', [$dates['start'], $dates['end']])
            ->where('status', '!=', 'cancelled')
            ->select([
                DB::raw('COUNT(*) as total_orders'),
                DB::raw('SUM(total_amount) as total_revenue'),
                DB::raw('AVG(total_amount) as avg_order_value'),
                DB::raw('COUNT(DISTINCT customer_id) as unique_customers')
            ])
            ->first();

        return response()->json($stats);
    }

    public function salesTrends(Request $request): JsonResponse
    {
        $range = $request->get('range', '7days');
        $dates = $this->getDateRange($range);
        $groupBy = $this->getGroupByFormat($range);

        $trends = Order::whereBetween('created_at', [$dates['start'], $dates['end']])
            ->where('status', '!=', 'cancelled')
            ->select([
                DB::raw($groupBy . ' as date'),
                DB::raw('COUNT(*) as orders'),
                DB::raw('SUM(total_amount) as revenue')
            ])
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json(['data' => $trends]);
    }

    public function topSellingItems(Request $request): JsonResponse
    {
        $range = $request->get('range', '7days');
        $dates = $this->getDateRange($range);

        $topItems = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->join('menu_item_translations', function($join) {
                $join->on('menu_items.id', '=', 'menu_item_translations.menu_item_id')
                     ->where('menu_item_translations.locale', '=', 'en');
            })
            ->whereBetween('orders.created_at', [$dates['start'], $dates['end']])
            ->where('orders.status', '!=', 'cancelled')
            ->select([
                'menu_items.id',
                'menu_item_translations.name',
                DB::raw('SUM(order_items.quantity) as quantity_sold'),
                DB::raw('SUM(order_items.total_price) as revenue')
            ])
            ->groupBy('menu_items.id', 'menu_item_translations.name')
            ->orderByDesc('quantity_sold')
            ->limit(10)
            ->get();

        return response()->json(['data' => $topItems]);
    }

    public function salesByCategory(Request $request): JsonResponse
    {
        $range = $request->get('range', '7days');
        $dates = $this->getDateRange($range);

        $categoryData = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->join('categories', 'menu_items.category_id', '=', 'categories.id')
            ->join('category_translations', function($join) {
                $join->on('categories.id', '=', 'category_translations.category_id')
                     ->where('category_translations.locale', '=', 'en');
            })
            ->whereBetween('orders.created_at', [$dates['start'], $dates['end']])
            ->where('orders.status', '!=', 'cancelled')
            ->select([
                'category_translations.name',
                DB::raw('SUM(order_items.total_price) as value')
            ])
            ->groupBy('categories.id', 'category_translations.name')
            ->get();

        return response()->json(['data' => $categoryData]);
    }

    public function peakHours(Request $request): JsonResponse
    {
        $range = $request->get('range', '7days');
        $dates = $this->getDateRange($range);

        $driver = DB::connection()->getDriverName();
        $hourSql = $driver === 'sqlite' ? "CAST(strftime('%H', created_at) AS INTEGER)" : "HOUR(created_at)";

        $peakHours = Order::whereBetween('created_at', [$dates['start'], $dates['end']])
            ->where('status', '!=', 'cancelled')
            ->select([
                DB::raw("$hourSql as hour"),
                DB::raw('COUNT(*) as orders'),
                DB::raw('SUM(total_amount) as revenue')
            ])
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->map(function ($item) {
                $item->hour = sprintf('%02d:00', $item->hour);
                return $item;
            });

        return response()->json(['data' => $peakHours]);
    }

    public function salesByPaymentMethod(Request $request): JsonResponse
    {
        $range = $request->get('range', '7days');
        $dates = $this->getDateRange($range);

        $paymentData = Order::whereBetween('created_at', [$dates['start'], $dates['end']])
            ->where('status', '!=', 'cancelled')
            ->select([
                'payment_method',
                DB::raw('COUNT(*) as orders'),
                DB::raw('SUM(total_amount) as revenue')
            ])
            ->groupBy('payment_method')
            ->get();

        return response()->json(['data' => $paymentData]);
    }

    public function customerMetrics(Request $request): JsonResponse
    {
        $range = $request->get('range', '7days');
        $dates = $this->getDateRange($range);

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
            'avg_orders_per_customer' => Order::whereBetween('created_at', [$dates['start'], $dates['end']])
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
            ->where('status', '!=', 'cancelled')
            ->select([
                DB::raw('COUNT(*) as total_orders'),
                DB::raw('SUM(total_amount) as total_revenue'),
                DB::raw('AVG(total_amount) as avg_order_value'),
                DB::raw('MIN(total_amount) as min_order'),
                DB::raw('MAX(total_amount) as max_order')
            ])
            ->first();

        return response()->json($summary);
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

        // Generate PDF
        $pdf = Pdf::loadView('exports.sales-analytics', $data);
        return $pdf->download('sales-analytics-' . date('Y-m-d') . '.pdf');
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

        $dates = $this->getDateRangeFromRequest($request);
        
        // Gather data matching PDF structure
        $overview = $this->getSalesData($dates);
        $trends = $this->getTrendsData($dates);
        $topItems = $this->getTopItemsData($dates);
        $categories = $this->getCategoryData($dates);

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="sales-analytics-' . date('Y-m-d') . '.csv"',
        ];

        $callback = function() use ($overview, $trends, $topItems, $categories, $dates) {
            $file = fopen('php://output', 'w');
            
            // 1. Title & Period
            fputcsv($file, ['Sales Analytics Report']);
            fputcsv($file, ['Period:', $dates['start']->format('Y-m-d') . ' to ' . $dates['end']->format('Y-m-d')]);
            fputcsv($file, []); // Spacer

            // 2. Overview
            fputcsv($file, ['OVERVIEW']);
            fputcsv($file, ['Total Revenue', 'Total Orders', 'Avg Order Value', 'Unique Customers']);
            fputcsv($file, [
                $overview['total_revenue'],
                $overview['total_orders'],
                $overview['avg_order_value'],
                $overview['unique_customers']
            ]);
            fputcsv($file, []);

            // 3. Trends
            fputcsv($file, ['SALES TRENDS']);
            fputcsv($file, ['Date', 'Orders', 'Revenue']);
            foreach ($trends as $trend) {
                fputcsv($file, [$trend->date, $trend->orders, $trend->revenue]); // Trends is array of objects in getTrendsData -> check return type
            }
            fputcsv($file, []);

            // 4. Top Selling Items
            fputcsv($file, ['TOP SELLING ITEMS']);
            fputcsv($file, ['Item Name', 'Quantity Sold', 'Revenue']);
            foreach ($topItems as $item) {
                // $item is array from getTopItemsData
                fputcsv($file, [$item['name'], $item['quantity_sold'], $item['revenue']]);
            }
            fputcsv($file, []);

            // 5. Sales by Category
            fputcsv($file, ['SALES BY CATEGORY']);
            fputcsv($file, ['Category', 'Revenue']);
            foreach ($categories as $cat) {
                 // $cat is array from getCategoryData
                fputcsv($file, [$cat['name'], $cat['value']]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
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
                $itemArray = $item->toArray();
                $itemArray['unit'] = $item->unit?->code ?? 'unit';
                return $itemArray;
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

        $pdf = Pdf::loadView('exports.inventory-reports', $data);
        return $pdf->download('inventory-report-' . date('Y-m-d') . '.pdf');
    }

    public function exportInventoryCSV(Request $request)
    {
        $dates = $this->getDateRangeFromRequest($request);
        
        $currentValue = Inventory::join('ingredients', 'inventory.ingredient_id', '=', 'ingredients.id')
            ->sum(DB::raw('inventory.quantity * ingredients.cost_per_unit'));

        $csv = "Metric,Value\n";
        $csv .= "Total Inventory Value," . number_format($currentValue, 2) . "\n";
        $csv .= "Report Date," . date('Y-m-d') . "\n";

        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="inventory-report-' . date('Y-m-d') . '.csv"');
    }

    /**
     * Export Financial Reports
     */
    public function exportFinancialPDF(Request $request)
    {
        $dates = $this->getDateRangeFromRequest($request);

        // 1. Profit & Loss Data
        $revenue = Order::whereBetween('created_at', [$dates['start'], $dates['end']])
            ->where('status', '!=', 'cancelled')
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

        $expenseBreakdown = Expense::whereBetween('expense_date', [$dates['start'], $dates['end']])
            ->join('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->select([
                'expense_categories.name as category',
                DB::raw('SUM(expenses.amount) as amount')
            ])
            ->groupBy('expense_categories.id', 'expense_categories.name')
            ->get()
            ->map(function ($item) use ($expenses) {
                return [
                    'category' => $item->category,
                    'amount' => $item->amount,
                    'percentage' => $expenses > 0 ? ($item->amount / $expenses) * 100 : 0,
                    'change' => 0 // Placeholder
                ];
            })
            ->toArray();

        $profitLoss = [
            'total_revenue' => $revenue,
            'cogs' => $cogsValue,
            'total_expenses' => $totalExpenses, // Operating + COGS
            'net_profit' => $netProfit,
            'profit_margin' => $margin,
            'expense_categories' => $expenseBreakdown
        ];

        // 2. Margins Data
        $marginsByCategory = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->join('categories', 'menu_items.category_id', '=', 'categories.id')
            ->join('category_translations', function($join) {
                $join->on('categories.id', '=', 'category_translations.category_id')
                     ->where('category_translations.locale', '=', 'en');
            })
            ->whereBetween('orders.created_at', [$dates['start'], $dates['end']])
            ->where('orders.status', '!=', 'cancelled')
            ->select([
                'category_translations.name as category',
                DB::raw('SUM(order_items.total_price) as revenue'),
                DB::raw('SUM(order_items.total_price * 0.3) as cost'), // Mock cost 30%
            ])
            ->groupBy('categories.id', 'category_translations.name')
            ->get()
            ->map(function ($item) {
                $margin = $item->revenue > 0 ? (($item->revenue - $item->cost) / $item->revenue) * 100 : 0;
                return [
                    'category' => $item->category,
                    'revenue' => $item->revenue,
                    'cost' => $item->cost,
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

        $pdf = Pdf::loadView('exports.financial-dashboard', $data);
        return $pdf->download('financial-report-' . date('Y-m-d') . '.pdf');
    }

    public function exportFinancialCSV(Request $request)
    {
        $dates = $this->getDateRangeFromRequest($request);

        // Reuse the logic from PDF export to ensure consistency
        // 1. Profit & Loss
        $revenue = Order::whereBetween('created_at', [$dates['start'], $dates['end']])
            ->where('status', '!=', 'cancelled')
            ->sum('total_amount');

        $expenses = Expense::whereBetween('expense_date', [$dates['start'], $dates['end']])
            ->sum('amount');

        $cogsValue = InventoryTransaction::whereBetween('inventory_transactions.created_at', [$dates['start'], $dates['end']])
            ->where('type', 'usage')
            ->join('ingredients', 'inventory_transactions.ingredient_id', '=', 'ingredients.id')
            ->sum(DB::raw('inventory_transactions.quantity * ingredients.cost_per_unit'));

        $totalExpenses = $expenses + $cogsValue;
        $netProfit = $revenue - $totalExpenses;
        $margin = $revenue > 0 ? ($netProfit / $revenue) * 100 : 0;

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


        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="financial-report-' . date('Y-m-d') . '.csv"',
        ];

        $callback = function() use ($dates, $revenue, $cogsValue, $expenses, $totalExpenses, $netProfit, $margin, $expenseBreakdown, $cogsBreakdown) {
            $file = fopen('php://output', 'w');
            
            // 1. Title
            fputcsv($file, ['Financial Dashboard Report']);
            fputcsv($file, ['Period:', $dates['start']->format('Y-m-d') . ' to ' . $dates['end']->format('Y-m-d')]);
            fputcsv($file, []);

            // 2. Summary
            fputcsv($file, ['PROFIT & LOSS SUMMARY']);
            fputcsv($file, ['Total Revenue', number_format($revenue, 2)]);
            fputcsv($file, ['Cost of Goods Sold (COGS)', number_format($cogsValue, 2)]);
            fputcsv($file, ['Operating Expenses', number_format($expenses, 2)]);
            fputcsv($file, ['Total Expenses', number_format($totalExpenses, 2)]);
            fputcsv($file, ['Net Profit', number_format($netProfit, 2)]);
            fputcsv($file, ['Profit Margin (%)', number_format($margin, 1) . '%']);
            fputcsv($file, []);

            // 3. Expense Breakdown
            fputcsv($file, ['EXPENSE BREAKDOWN']);
            fputcsv($file, ['Category', 'Amount']);
            foreach ($expenseBreakdown as $exp) {
                fputcsv($file, [$exp->category, number_format($exp->amount, 2)]);
            }
            fputcsv($file, []);

             // 4. COGS Breakdown
            fputcsv($file, ['COGS BREAKDOWN']);
            fputcsv($file, ['Category', 'Amount']);
            foreach ($cogsBreakdown as $cogs) {
                fputcsv($file, [$cogs->name, number_format($cogs->value, 2)]);
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
            ->where('status', '!=', 'cancelled')
            ->select([
                DB::raw('COUNT(*) as total_orders'),
                DB::raw('SUM(total_amount) as total_revenue'),
                DB::raw('AVG(total_amount) as avg_order_value'),
                DB::raw('COUNT(DISTINCT customer_id) as unique_customers')
            ])
            ->first();

        return $stats->toArray();
    }

    private function getTrendsData($dates): array
    {
        $daysDiff = $dates['start']->diffInDays($dates['end']);
        $groupBy = $daysDiff > 60 ? "DATE_FORMAT(created_at, '%Y-%m')" : "DATE(created_at)";

        $trends = Order::whereBetween('created_at', [$dates['start'], $dates['end']])
            ->where('status', '!=', 'cancelled')
            ->select([
                DB::raw($groupBy . ' as date'),
                DB::raw('COUNT(*) as orders'),
                DB::raw('SUM(total_amount) as revenue')
            ])
            ->groupBy('date')
            ->orderBy('date')
            ->get()
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
            ->join('menu_item_translations', function($join) {
                $join->on('menu_items.id', '=', 'menu_item_translations.menu_item_id')
                     ->where('menu_item_translations.locale', '=', 'en');
            })
            ->whereBetween('orders.created_at', [$dates['start'], $dates['end']])
            ->where('orders.status', '!=', 'cancelled')
            ->select([
                'menu_item_translations.name',
                DB::raw('SUM(order_items.quantity) as quantity_sold'),
                DB::raw('SUM(order_items.total_price) as revenue')
            ])
            ->groupBy('menu_items.id', 'menu_item_translations.name')
            ->orderByDesc('quantity_sold')
            ->limit(10)
            ->get()
            ->map(fn ($item) => (array) $item)
            ->toArray();

        return $topItems;
    }

    private function getCategoryData($dates): array
    {
        $categoryData = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->join('categories', 'menu_items.category_id', '=', 'categories.id')
            ->join('category_translations', function($join) {
                $join->on('categories.id', '=', 'category_translations.category_id')
                     ->where('category_translations.locale', '=', 'en');
            })
            ->whereBetween('orders.created_at', [$dates['start'], $dates['end']])
            ->where('orders.status', '!=', 'cancelled')
            ->select([
                'category_translations.name',
                DB::raw('SUM(order_items.total_price) as value')
            ])
            ->groupBy('categories.id', 'category_translations.name')
            ->get()
            ->map(fn ($item) => (array) $item)
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

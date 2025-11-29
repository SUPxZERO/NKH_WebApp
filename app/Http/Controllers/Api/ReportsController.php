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
        $groupBy = $this->getGroupByFormat($range);

        $usage = InventoryTransaction::whereBetween('created_at', [$dates['start'], $dates['end']])
            ->where('type', 'usage')
            ->select([
                DB::raw($groupBy . ' as date'),
                DB::raw('SUM(quantity) as usage')
            ])
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json(['data' => $usage]);
    }

    public function wasteTracking(Request $request): JsonResponse
    {
        $range = $request->get('range', '30days');
        $dates = $this->getDateRange($range);

        $wasteByReason = InventoryAdjustment::whereBetween('created_at', [$dates['start'], $dates['end']])
            ->whereIn('reason', ['damaged', 'expired', 'spillage', 'theft'])
            ->join('ingredients', 'inventory_adjustments.ingredient_id', '=', 'ingredients.id')
            ->select([
                'inventory_adjustments.reason',
                DB::raw('ABS(SUM(inventory_adjustments.quantity_change * ingredients.cost_per_unit)) as value')
            ])
            ->groupBy('inventory_adjustments.reason')
            ->get();

        $totalWaste = $wasteByReason->sum('value');
        $totalRevenue = Order::whereBetween('created_at', [$dates['start'], $dates['end']])
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

        $totalExpenses = Expense::whereBetween('date', [$dates['start'], $dates['end']])
            ->sum('amount');

        // Calculate COGS
        $cogs = InventoryTransaction::whereBetween('created_at', [$dates['start'], $dates['end']])
            ->where('type', 'usage')
            ->join('ingredients', 'inventory_transactions.ingredient_id', '=', 'ingredients.id')
            ->select(DB::raw('SUM(inventory_transactions.quantity * ingredients.cost_per_unit) as total'))
            ->first();

        $totalCogs = $cogs->total ?? 0;
        $totalExpensesWithCogs = $totalExpenses + $totalCogs;
        $netProfit = $totalRevenue - $totalExpensesWithCogs;
        $profitMargin = $totalRevenue > 0 ? ($netProfit / $totalRevenue) * 100 : 0;

        // Expense breakdown
        $expenseCategories = Expense::whereBetween('date', [$dates['start'], $dates['end']])
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
        $groupBy = $this->getGroupByFormat($range);

        $data = DB::table('orders')
            ->whereBetween('orders.created_at', [$dates['start'], $dates['end']])
            ->where('orders.status', '!=', 'cancelled')
            ->select([
                DB::raw($groupBy . ' as date'),
                DB::raw('SUM(orders.total_amount) as revenue')
            ])
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) use ($dates, $groupBy) {
                // Get expenses for the same date
                $dateStr = $item->date;
                $expenses = Expense::when(
                    $groupBy === "DATE(created_at)",
                    fn($q) => $q->whereDate('date', $dateStr),
                    fn($q) => $q->where(DB::raw("DATE_FORMAT(date, '%Y-%m')"), $dateStr)
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

        $breakdown = InventoryTransaction::whereBetween('created_at', [$dates['start'], $dates['end']])
            ->where('type', 'usage')
            ->join('ingredients', 'inventory_transactions.ingredient_id', '=', 'ingredients.id')
            ->select([
                'ingredients.category as name',
                DB::raw('SUM(inventory_transactions.quantity * ingredients.cost_per_unit) as value')
            ])
            ->groupBy('ingredients.category')
            ->get();

        $total = $breakdown->sum('value');
        $revenue = Order::whereBetween('created_at', [$dates['start'], $dates['end']])
            ->where('status', '!=', 'cancelled')
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

    private function getGroupByFormat(string $range): string
    {
        switch ($range) {
            case 'today':
                return "DATE_FORMAT(created_at, '%H:00')";
            case '7days':
            case '30days':
                return "DATE(created_at)";
            case '90days':
            case 'year':
                return "DATE_FORMAT(created_at, '%Y-%m')";
            default:
                return "DATE(created_at)";
        }
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Customer;
use App\Models\MenuItem;
use App\Models\Reservation;
use App\Models\Employee;
use App\Models\DiningTable;
use App\Models\Expense;
use App\Models\CustomerRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class DashboardController extends Controller
{
    private const CACHE_TTL = 300; // 5 minutes

    public function stats(): JsonResponse
    {
        try {
            return Cache::remember('dashboard_stats', self::CACHE_TTL, function () {
                return $this->getStats();
            });
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch dashboard statistics',
                'message' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    public function refresh(): JsonResponse
    {
        try {
            Cache::forget('dashboard_stats');
            return $this->getStats();
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to refresh dashboard statistics',
                'message' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    private function getStats(): JsonResponse
    {
        try {
        $today = Carbon::today();
        $thisMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();
        
        // Orders and Revenue
        $ordersQuery = Order::query();
        $todayOrders = (clone $ordersQuery)->whereDate('created_at', $today)->count();
        $todayRevenue = (clone $ordersQuery)->whereDate('created_at', $today)->sum('total');
        $monthlyOrders = (clone $ordersQuery)->whereDate('created_at', '>=', $thisMonth)->count();
        $monthlyRevenue = (clone $ordersQuery)->whereDate('created_at', '>=', $thisMonth)->sum('total');
        $lastMonthRevenue = (clone $ordersQuery)
            ->whereBetween('created_at', [$lastMonth, $thisMonth])
            ->sum('total');

        // Revenue Growth
        $revenueGrowth = $lastMonthRevenue > 0 
            ? (($monthlyRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100 
            : 0;

        // Business Overview
        $activeEmployees = Employee::where('status', 'active')->count();
        $totalTables = DiningTable::count();
        $occupiedTables = DiningTable::where('status', 'occupied')->count();
        $tablesOccupancyRate = $totalTables > 0 ? ($occupiedTables / $totalTables) * 100 : 0;

        // Financial Insights
        $monthlyExpenses = Expense::approved()
            ->whereDate('expense_date', '>=', $thisMonth)
            ->sum('amount');
        $grossProfit = $monthlyRevenue - $monthlyExpenses;
        $profitMargin = $monthlyRevenue > 0 ? ($grossProfit / $monthlyRevenue) * 100 : 0;

        // Customer Metrics
        $totalCustomers = Customer::count();
        $newCustomers = Customer::whereDate('created_at', '>=', $thisMonth)->count();
        $customersLastMonth = Customer::whereBetween('created_at', [$lastMonth, $thisMonth])->count();
        $customerGrowth = $customersLastMonth > 0 
            ? (($newCustomers - $customersLastMonth) / $customersLastMonth) * 100 
            : 0;

        // Menu Performance
        $popularItems = MenuItem::withCount(['orderItems' => function($query) use ($thisMonth) {
            $query->whereHas('order', function($q) use ($thisMonth) {
                $q->whereDate('created_at', '>=', $thisMonth);
            });
        }])
        ->with(['category', 'translations'])
        ->orderByDesc('order_items_count')
        ->limit(5)
        ->get();

        // Category Performance
        $categoryPerformance = Category::join('menu_items', 'categories.id', '=', 'menu_items.category_id')
            ->join('order_items', 'menu_items.id', '=', 'order_items.menu_item_id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereDate('orders.created_at', '>=', $thisMonth)
            ->select(
                'categories.id',
                DB::raw('(SELECT name FROM category_translations WHERE category_id = categories.id AND locale = ?) as name'),
                DB::raw('COUNT(order_items.id) as total_orders'),
                DB::raw('SUM(order_items.quantity * menu_items.price) as revenue')
            )
            ->setBindings([app()->getLocale()])
            ->groupBy('categories.id')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get();

        // Hourly Revenue Distribution
        $hourlyRevenue = Order::whereDate('created_at', $today)
            ->select(
                DB::raw('HOUR(created_at) as hour'),
                DB::raw('SUM(total) as revenue'),
                DB::raw('COUNT(*) as orders')
            )
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

        // Reservations Overview
        $todayReservations = Reservation::whereDate('reservation_date', $today)->count();
        $pendingReservations = Reservation::where('status', 'pending')->count();
        $reservationTrend = Reservation::whereDate('reservation_date', '>=', Carbon::now())
            ->whereDate('reservation_date', '<=', Carbon::now()->addDays(7))
            ->select(
                DB::raw('DATE(reservation_date) as date'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Order Status Distribution
        $orderStatusDistribution = Order::select('status', DB::raw('count(*) as count'))
            ->whereDate('created_at', '>=', $thisMonth)
            ->groupBy('status')
            ->get();

        // Open Customer Requests
        $openRequests = CustomerRequest::where('status', 'open')->count();

        // Revenue Trend
        $revenueTrend = Order::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('SUM(total) as revenue'),
            DB::raw('COUNT(*) as orders')
        )
            ->whereDate('created_at', '>=', Carbon::now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json([
            'today' => [
                'orders' => $todayOrders,
                'revenue' => $todayRevenue,
                'new_customers' => $newCustomers,
                'reservations' => $todayReservations,
            ],
            'monthly' => [
                'orders' => $monthlyOrders,
                'revenue' => $monthlyRevenue,
                'revenue_growth' => round($revenueGrowth, 2),
                'expenses' => $monthlyExpenses,
                'gross_profit' => $grossProfit,
                'profit_margin' => round($profitMargin, 2),
            ],
            'customers' => [
                'total' => $totalCustomers,
                'new_this_month' => $newCustomers,
                'growth_rate' => round($customerGrowth, 2),
            ],
            'business' => [
                'active_employees' => $activeEmployees,
                'total_tables' => $totalTables,
                'occupied_tables' => $occupiedTables,
                'occupancy_rate' => round($tablesOccupancyRate, 2),
            ],
            'menu' => [
                'popular_items' => $popularItems,
                'category_performance' => $categoryPerformance,
            ],
            'analytics' => [
                'hourly_revenue' => $hourlyRevenue,
                'order_status_distribution' => $orderStatusDistribution,
                'revenue_trend' => $revenueTrend,
            ],
            'reservations' => [
                'today' => $todayReservations,
                'pending' => $pendingReservations,
                'upcoming_trend' => $reservationTrend,
            ],
            'requests' => [
                'open' => $openRequests,
            ],
            'last_updated' => now()->toIso8601String()
        ]);
        } catch (\Exception $e) {
            throw new \Exception('Failed to generate dashboard statistics: ' . $e->getMessage());
        }
    }
}
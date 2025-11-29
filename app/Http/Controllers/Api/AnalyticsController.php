<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\MenuItem;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

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

        $topItems = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->whereBetween('orders.created_at', [$dates['start'], $dates['end']])
            ->where('orders.status', '!=', 'cancelled')
            ->select([
                'menu_items.id',
                'menu_items.name',
                DB::raw('SUM(order_items.quantity) as quantity_sold'),
                DB::raw('SUM(order_items.subtotal) as revenue')
            ])
            ->groupBy('menu_items.id', 'menu_items.name')
            ->orderByDesc('quantity_sold')
            ->limit(10)
            ->get();

        return response()->json(['data' => $topItems]);
    }

    public function salesByCategory(Request $request): JsonResponse
    {
        $range = $request->get('range', '7days');
        $dates = $this->getDateRange($range);

        $categoryData = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->join('categories', 'menu_items.category_id', '=', 'categories.id')
            ->whereBetween('orders.created_at', [$dates['start'], $dates['end']])
            ->where('orders.status', '!=', 'cancelled')
            ->select([
                'categories.name',
                DB::raw('SUM(order_items.subtotal) as value')
            ])
            ->groupBy('categories.id', 'categories.name')
            ->get();

        return response()->json(['data' => $categoryData]);
    }

    public function peakHours(Request $request): JsonResponse
    {
        $range = $request->get('range', '7days');
        $dates = $this->getDateRange($range);

        $peakHours = Order::whereBetween('created_at', [$dates['start'], $dates['end']])
            ->where('status', '!=', 'cancelled')
            ->select([
                DB::raw('HOUR(created_at) as hour'),
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

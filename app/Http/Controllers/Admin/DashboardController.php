<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function analytics()
    {
        $startOfDay = Carbon::now()->startOfDay();
        $endOfDay = Carbon::now()->endOfDay();

        $employees = Employee::with('user')
            ->withCount(['orders' => function($query) use ($startOfDay, $endOfDay) {
                $query->whereBetween('ordered_at', [$startOfDay, $endOfDay]);
            }])
            ->orderBy('orders_count', 'desc')
            ->get()
            ->map(function($employee) {
                return [
                    'id' => $employee->id,
                    'name' => optional($employee->user)->name,
                    'ordersHandled' => $employee->orders_count,
                    'rating' => 4.5 // You might want to implement actual rating logic
                ];
            });

        return response()->json([
            'data' => [
                'employees' => $employees
            ]
        ]);
    }

    public function orderStats()
    {
        $stats = Order::select('status', DB::raw('count(*) as count'))
            ->whereDate('ordered_at', Carbon::today())
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        return response()->json([
            'data' => [
                'pending' => $stats['pending'] ?? 0,
                'preparing' => $stats['preparing'] ?? 0,
                'ready' => $stats['ready'] ?? 0,
                'delivered' => $stats['completed'] ?? 0,
                'cancelled' => $stats['cancelled'] ?? 0,
            ]
        ]);
    }

    public function quickStats()
    {
        $today = Carbon::today();
        
        $totalOrders = Order::whereDate('ordered_at', $today)->count();
        $totalRevenue = Order::whereDate('ordered_at', $today)
            ->where(function($query) {
                $query->whereNotNull('completed_at')
                      ->orWhere('payment_status', 'paid');
            })
            ->sum('total_amount');
            
        return response()->json([
            'total_orders' => $totalOrders,
            'total_revenue' => (float) $totalRevenue,
            'pending_orders' => Order::where('payment_status', 'unpaid')->count(),
            'active_drivers' => 0 // Simplified: Employee role column does not exist
        ]);
    }

    public function revenue($period)
    {
        try {
            $now = Carbon::now();
            $revenue = collect();
            $driver = DB::connection()->getDriverName();
            $isSqlite = $driver === 'sqlite';

            // Use COALESCE to prefer completed_at, then ordered_at for determining revenue date
            $dateColumn = "COALESCE(completed_at, ordered_at)";

            switch ($period) {
                case 'daily':
                    // Show hourly breakdown for today (6 AM to 11 PM)
                    $startHour = 6;
                    $endHour = 23;

                    $hourSql = $isSqlite 
                        ? "CAST(strftime('%H', $dateColumn) AS INTEGER)" 
                        : "HOUR($dateColumn)";

                    $hourlyData = Order::select(
                        DB::raw("$hourSql as hour"),
                        DB::raw('SUM(total_amount) as total')
                    )
                    ->where(function($query) {
                        $query->whereNotNull('completed_at')
                              ->orWhere('payment_status', 'paid');
                    })
                    ->whereDate(DB::raw($dateColumn), $now->toDateString())
                    ->groupBy('hour')
                    ->get()
                    ->keyBy('hour');

                    for ($hour = $startHour; $hour <= $endHour; $hour++) {
                        $label = Carbon::today()->setHour($hour)->format('g A');
                        $revenue->push([
                            'label' => $label,
                            'total' => (float) ($hourlyData->get($hour)?->total ?? 0)
                        ]);
                    }
                    break;

                case 'weekly':
                    // Show all 7 days of the current week
                    $startOfWeek = $now->copy()->startOfWeek();
                    $endOfWeek = $now->copy()->endOfWeek();

                    // Use ordered_at for both filtering and grouping for consistency
                    $dateSql = $isSqlite ? "date(ordered_at)" : "DATE(ordered_at)";

                    $dailyData = Order::select(
                        DB::raw("$dateSql as date"),
                        DB::raw('SUM(total_amount) as total')
                    )
                    ->where(function($query) {
                        $query->whereNotNull('completed_at')
                              ->orWhere('payment_status', 'paid');
                    })
                    ->whereBetween('ordered_at', [$startOfWeek->toDateTimeString(), $endOfWeek->toDateTimeString()])
                    ->groupBy('date')
                    ->get()
                    ->keyBy('date');

                    for ($i = 0; $i < 7; $i++) {
                        $date = $startOfWeek->copy()->addDays($i);
                        // SQLite might return YYYY-MM-DD, so standardizing key
                        $dateKey = $date->toDateString(); 
                        $revenue->push([
                            'label' => $date->format('D'),
                            'total' => (float) ($dailyData->get($dateKey)?->total ?? 0)
                        ]);
                    }
                    break;

                case 'monthly':
                    // Show all days of the current month
                    $startOfMonth = $now->copy()->startOfMonth();
                    $endOfMonth = $now->copy()->endOfMonth();
                    $daysInMonth = $now->daysInMonth;

                    // Use ordered_at for both filtering and grouping for consistency
                    $dateSql = $isSqlite ? "date(ordered_at)" : "DATE(ordered_at)";

                    $dailyData = Order::select(
                        DB::raw("$dateSql as date"),
                        DB::raw('SUM(total_amount) as total')
                    )
                    ->where(function($query) {
                        $query->whereNotNull('completed_at')
                              ->orWhere('payment_status', 'paid');
                    })
                    ->whereBetween('ordered_at', [$startOfMonth->toDateTimeString(), $endOfMonth->toDateTimeString()])
                    ->groupBy('date')
                    ->get()
                    ->keyBy('date');

                    for ($day = 1; $day <= $daysInMonth; $day++) {
                        $date = $startOfMonth->copy()->addDays($day - 1);
                        $dateKey = $date->toDateString();
                        $revenue->push([
                            'label' => (string) $day,
                            'total' => (float) ($dailyData->get($dateKey)?->total ?? 0)
                        ]);
                    }
                    break;
            }

            // Calculate grand total for the display header
            $grandTotal = $revenue->sum('total');

            return response()->json([
                'data' => $revenue,
                'total' => $grandTotal,
                'range' => $period,
                'count' => $revenue->count()
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Dashboard Revenue Error ($period): " . $e->getMessage());
            \Illuminate\Support\Facades\Log::error($e->getTraceAsString());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}

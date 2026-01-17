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
                    // Last 7 days (matching DashboardDataService pattern)
                    for ($i = 6; $i >= 0; $i--) {
                        $date = $now->copy()->subDays($i);
                        
                        $total = Order::whereDate('ordered_at', $date->toDateString())
                            ->where(function($query) {
                                $query->whereNotNull('completed_at')
                                      ->orWhere('payment_status', 'paid');
                            })
                            ->sum('total_amount');

                        $revenue->push([
                            'date' => $date->format('Y-m-d'),
                            'label' => $date->format('M d'),
                            'total' => (float) $total
                        ]);
                    }
                    break;

                case 'weekly':
                    // Last 4 weeks (matching DashboardDataService pattern)
                    for ($i = 3; $i >= 0; $i--) {
                        $weekStart = $now->copy()->subWeeks($i)->startOfWeek();
                        $weekEnd = $now->copy()->subWeeks($i)->endOfWeek();
                        
                        $total = Order::whereBetween('ordered_at', [
                                $weekStart->toDateTimeString(), 
                                $weekEnd->toDateTimeString()
                            ])
                            ->where(function($query) {
                                $query->whereNotNull('completed_at')
                                      ->orWhere('payment_status', 'paid');
                            })
                            ->sum('total_amount');

                        $revenue->push([
                            'date' => $weekStart->format('Y-m-d'),
                            'label' => 'Week ' . $weekStart->weekOfYear,
                            'total' => (float) $total
                        ]);
                    }
                    break;

                case 'monthly':
                    // Last 6 months (matching DashboardDataService pattern)
                    for ($i = 5; $i >= 0; $i--) {
                        $monthStart = $now->copy()->subMonths($i)->startOfMonth();
                        $monthEnd = $now->copy()->subMonths($i)->endOfMonth();
                        
                        $total = Order::whereBetween('ordered_at', [
                                $monthStart->toDateTimeString(), 
                                $monthEnd->toDateTimeString()
                            ])
                            ->where(function($query) {
                                $query->whereNotNull('completed_at')
                                      ->orWhere('payment_status', 'paid');
                            })
                            ->sum('total_amount');

                        $revenue->push([
                            'date' => $monthStart->format('Y-m-d'),
                            'label' => $monthStart->format('M Y'),
                            'total' => (float) $total
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

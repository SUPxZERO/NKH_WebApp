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
    protected $dashboardService;

    public function __construct(\App\Services\Dashboard\DashboardDataService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    public function analytics()
    {
        // Keeping legacy method for now if frontend relies on specific structure not in service
        // Ideally this should use Service too, but let's focus on the broken Revenue first.
        
        $startOfDay = Carbon::now()->startOfDay();
        $endOfDay = Carbon::now()->endOfDay();

        $employees = Employee::with('user')
            ->withCount(['orders' => function($query) use ($startOfDay, $endOfDay) {
                $query->whereBetween('created_at', [$startOfDay, $endOfDay]); // Changed to created_at to match seeder
            }])
            ->orderBy('orders_count', 'desc')
            ->get()
            ->map(function($employee) {
                return [
                    'id' => $employee->id,
                    'name' => optional($employee->user)->name,
                    'ordersHandled' => $employee->orders_count,
                    'rating' => 4.5 
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
        // Use JOIN to correctly group by status code from the relationship
        // This handles cases where the 'status' column on the orders table might not be synced
        $stats = Order::join('order_statuses', 'orders.order_status_id', '=', 'order_statuses.id')
            ->select('order_statuses.code', DB::raw('count(*) as count'))
            // ->whereDate('orders.created_at', Carbon::today()) // Removed filter
            ->groupBy('order_statuses.code')
            ->get()
            ->pluck('count', 'code')
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
        // Delegate to service
        // Return duplicate raw structure to match Frontend 'QuickStats' interface
        return response()->json($this->dashboardService->getQuickStats());
    }

    public function revenue($period)
    {
        try {
            // DELEGATE TO SERVICE
            $data = $this->dashboardService->getRevenueByRange($period);
            return response()->json($data);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Dashboard Revenue Error ($period): " . $e->getMessage());
            \Illuminate\Support\Facades\Log::error($e->getTraceAsString());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}

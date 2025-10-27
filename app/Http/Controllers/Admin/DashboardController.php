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
        
        $employees = Employee::withCount(['orders' => function($query) use ($startOfDay, $endOfDay) {
            $query->whereBetween('created_at', [$startOfDay, $endOfDay]);
        }])
        ->orderBy('orders_count', 'desc')
        ->get()
        ->map(function($employee) {
            return [
                'id' => $employee->id,
                'name' => $employee->user->name,
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
            ->whereDate('created_at', Carbon::today())
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        return response()->json([
            'data' => [
                'pending' => $stats['pending'] ?? 0,
                'preparing' => $stats['preparing'] ?? 0,
                'ready' => $stats['ready'] ?? 0,
                'delivered' => $stats['delivered'] ?? 0,
                'cancelled' => $stats['cancelled'] ?? 0,
            ]
        ]);
    }

    public function revenue($period)
    {
        $now = Carbon::now();
        
        $query = Order::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('SUM(total_amount) as total')
        )
        ->where('status', 'completed')
        ->where('payment_status', 'paid')
        ->groupBy('date');

        switch ($period) {
            case 'daily':
                $query->whereDate('created_at', $now);
                break;
            case 'weekly':
                $query->whereBetween('created_at', [
                    $now->copy()->startOfWeek(),
                    $now->copy()->endOfWeek()
                ]);
                break;
            case 'monthly':
                $query->whereMonth('created_at', $now->month)
                    ->whereYear('created_at', $now->year);
                break;
        }

        $revenue = $query->get()
            ->map(function($item) {
                return [
                    'label' => $item->date,
                    'value' => (float)$item->total
                ];
            });

        return response()->json([
            'data' => $revenue
        ]);
    }
}
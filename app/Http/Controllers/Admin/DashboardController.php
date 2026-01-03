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

    public function revenue($period)
    {
        $now = Carbon::now();
        $revenue = collect();

        // Use COALESCE to prefer completed_at, then ordered_at for determining revenue date
        // Include orders that are either completed OR have payment_status = 'paid'
        // Note: orders table doesn't have paid_at column, use completed_at or ordered_at

        switch ($period) {
            case 'daily':
                // Show hourly breakdown for today (6 AM to 11 PM)
                $startHour = 6;
                $endHour = 23;

                $hourlyData = Order::select(
                    DB::raw('HOUR(COALESCE(completed_at, ordered_at)) as hour'),
                    DB::raw('SUM(total_amount) as total')
                )
                ->where(function($query) {
                    $query->where('status', 'completed')
                          ->orWhere('payment_status', 'paid');
                })
                ->whereDate(DB::raw('COALESCE(completed_at, ordered_at)'), $now->toDateString())
                ->groupBy('hour')
                ->get()
                ->keyBy('hour');

                for ($hour = $startHour; $hour <= $endHour; $hour++) {
                    $label = Carbon::today()->setHour($hour)->format('g A');
                    $revenue->push([
                        'label' => $label,
                        'value' => (float) ($hourlyData->get($hour)?->total ?? 0)
                    ]);
                }
                break;

            case 'weekly':
                // Show all 7 days of the current week
                $startOfWeek = $now->copy()->startOfWeek();
                $endOfWeek = $now->copy()->endOfWeek();

                $dailyData = Order::select(
                    DB::raw('DATE(COALESCE(completed_at, ordered_at)) as date'),
                    DB::raw('SUM(total_amount) as total')
                )
                ->where(function($query) {
                    $query->where('status', 'completed')
                          ->orWhere('payment_status', 'paid');
                })
                ->whereBetween(DB::raw('COALESCE(completed_at, ordered_at)'), [$startOfWeek, $endOfWeek])
                ->groupBy('date')
                ->get()
                ->keyBy('date');

                for ($i = 0; $i < 7; $i++) {
                    $date = $startOfWeek->copy()->addDays($i);
                    $dateKey = $date->toDateString();
                    $revenue->push([
                        'label' => $date->format('D'),
                        'value' => (float) ($dailyData->get($dateKey)?->total ?? 0)
                    ]);
                }
                break;

            case 'monthly':
                // Show all days of the current month
                $startOfMonth = $now->copy()->startOfMonth();
                $daysInMonth = $now->daysInMonth;

                $dailyData = Order::select(
                    DB::raw('DATE(COALESCE(completed_at, ordered_at)) as date'),
                    DB::raw('SUM(total_amount) as total')
                )
                ->where(function($query) {
                    $query->where('status', 'completed')
                          ->orWhere('payment_status', 'paid');
                })
                ->whereMonth(DB::raw('COALESCE(completed_at, ordered_at)'), $now->month)
                ->whereYear(DB::raw('COALESCE(completed_at, ordered_at)'), $now->year)
                ->groupBy('date')
                ->get()
                ->keyBy('date');

                for ($day = 1; $day <= $daysInMonth; $day++) {
                    $date = $startOfMonth->copy()->addDays($day - 1);
                    $dateKey = $date->toDateString();
                    $revenue->push([
                        'label' => (string) $day,
                        'value' => (float) ($dailyData->get($dateKey)?->total ?? 0)
                    ]);
                }
                break;
        }

        return response()->json([
            'data' => $revenue
        ]);
    }
}

<?php

namespace App\Services\Dashboard;

use App\Models\Order;
use App\Models\Employee;
use App\Models\StockAlert;
use App\Models\TimeOffRequest;
use App\Models\InventoryAdjustment;
use App\Models\Reservation;
use App\Models\Payment;
use App\Models\Shift;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

/**
 * Dashboard Data Service
 * 
 * Provides role-aware dashboard data aggregation for the admin command center.
 * This service powers the redesigned admin dashboard with action-oriented widgets.
 */
class DashboardDataService
{
    /**
     * Get role-aware dashboard summary data.
     * Returns different data based on user's role and permissions.
     */
    public function getSummary(User $user): array
    {
        $roles = $user->roles->pluck('slug')->toArray();

        $data = [
            'user' => [
                'name' => $user->name,
                'role' => $roles[0] ?? 'employee',
                'roles' => $roles,
            ],
            'today' => Carbon::today()->toDateString(),
            'greeting' => $this->getGreeting(),
        ];

        // Super Admin / Admin - System health + all data
        if ($this->hasAnyRole($roles, ['super-admin', 'admin'])) {
            $data['system_health'] = $this->getSystemHealth();
            $data['critical_alerts'] = $this->getCriticalAlerts();
            $data['performance'] = $this->getTodayPerformance();
            // Merge Manager operational data for Admins
            $data['pending_approvals'] = $this->getAllPendingApprovals();
            $data['team_status'] = $this->getTeamOnDuty();
            $data['quick_actions'] = $this->getAdminQuickActions();

            // Multi-branch overview for Super Admins
            if ($user->getActiveBranchId() === null) {
                $data['branch_overview'] = $this->getBranchOverview();
            }
        }
        // Manager - Operations focus
        elseif ($this->hasAnyRole($roles, ['manager', 'service-manager', 'chief'])) {
            $data['pending_approvals'] = $this->getManagerApprovals();
            $data['team_status'] = $this->getTeamOnDuty();
            $data['performance'] = $this->getTodayPerformance();
            $data['quick_actions'] = $this->getManagerQuickActions();
        }
        // Employee / Staff - Personal focus
        else {
            $data['my_tasks'] = $this->getEmployeeTasks($user);
            $data['my_performance'] = $this->getEmployeePerformance($user);
            $data['quick_actions'] = $this->getEmployeeQuickActions();
        }

        return $data;
    }

    /**
     * Get pending items that require action.
     */
    public function getAlerts(User $user): array
    {
        $roles = $user->roles->pluck('slug')->toArray();
        $alerts = [];


        // Stock alerts
        if ($this->hasPermission($user, 'inventory.view')) {
            $stockAlerts = StockAlert::where('acknowledged', false)->count();
            if ($stockAlerts > 0) {
                $alerts[] = [
                    'type' => 'stock_alert',
                    'severity' => $stockAlerts > 5 ? 'high' : 'medium',
                    'count' => $stockAlerts,
                    'message' => "{$stockAlerts} stock alert(s) need attention",
                    'action' => '/admin/stock-alerts',
                ];
            }
        }

        // Time-off requests
        if ($this->hasPermission($user, 'employees.manage')) {
            $timeOffRequests = TimeOffRequest::where('status', 'pending')->count();
            if ($timeOffRequests > 0) {
                $alerts[] = [
                    'type' => 'time_off',
                    'severity' => 'medium',
                    'count' => $timeOffRequests,
                    'message' => "{$timeOffRequests} time-off request(s) pending",
                    'action' => '/admin/time-off-requests',
                ];
            }
        }

        // Inventory adjustments pending approval
        if ($this->hasPermission($user, 'inventory.approve')) {
            $adjustments = InventoryAdjustment::where('status', 'pending')->count();
            if ($adjustments > 0) {
                $alerts[] = [
                    'type' => 'inventory_adjustment',
                    'severity' => 'medium',
                    'count' => $adjustments,
                    'message' => "{$adjustments} inventory adjustment(s) pending",
                    'action' => '/admin/inventory-adjustments?status=pending',
                ];
            }
        }

        // Today's reservations
        if ($this->hasPermission($user, 'reservations.view')) {
            $todayReservations = Reservation::whereDate('reservation_date', Carbon::today())
                ->whereIn('status', ['pending', 'confirmed'])
                ->count();
            if ($todayReservations > 0) {
                $alerts[] = [
                    'type' => 'reservation',
                    'severity' => 'low',
                    'count' => $todayReservations,
                    'message' => "{$todayReservations} reservation(s) today",
                    'action' => '/admin/reservations',
                ];
            }
        }

        // Sort by severity
        $severityOrder = ['high' => 0, 'medium' => 1, 'low' => 2];
        usort($alerts, fn($a, $b) => $severityOrder[$a['severity']] <=> $severityOrder[$b['severity']]);

        return $alerts;
    }

    /**
     * Get real-time quick stats for the dashboard header.
     */
    public function getQuickStats(): array
    {
        $today = Carbon::today();
        $yesterday = Carbon::yesterday();

        // Today's revenue - prefer Payments but fallback to Order totals
        $todayPaymentRevenue = Payment::whereDate('created_at', $today)
            ->whereHas('paymentStatus', fn($q) => $q->where('is_successful', true))
            ->whereHas('invoice.order')
            ->sum('amount');

        // If no payments, use order totals (for confirmed/completed orders)
        $todayRevenue = $todayPaymentRevenue > 0
            ? (float) $todayPaymentRevenue
            : (float) Order::whereDate('created_at', $today)
                ->where(function ($q) {
                    $q->doesntHave('orderStatus')
                        ->orWhereHas('orderStatus', fn($sq) => $sq->whereNotIn('code', ['cancelled', 'rejected']));
                })
                ->sum('total_amount');

        $yesterdayPaymentRevenue = Payment::whereDate('created_at', $yesterday)
            ->whereHas('paymentStatus', fn($q) => $q->where('is_successful', true))
            ->whereHas('invoice.order')
            ->sum('amount');

        $yesterdayRevenue = $yesterdayPaymentRevenue > 0
            ? (float) $yesterdayPaymentRevenue
            : (float) Order::whereDate('created_at', $yesterday)
                ->where(function ($q) {
                    $q->doesntHave('orderStatus')
                        ->orWhereHas('orderStatus', fn($sq) => $sq->whereNotIn('code', ['cancelled', 'rejected']));
                })
                ->sum('total_amount');

        // Today's orders
        $todayOrders = Order::whereDate('created_at', $today)->count();
        $yesterdayOrders = Order::whereDate('created_at', $yesterday)->count();

        // Active orders (not completed/cancelled) - use orderStatus relationship
        $activeOrders = Order::whereHas('orderStatus', function ($q) {
            $q->whereIn('code', ['pending', 'received', 'preparing', 'ready']);
        })->count();

        // Orders by status - get from order_statuses relationship
        $ordersByStatus = Order::whereDate('created_at', $today)
            ->with('orderStatus')
            ->get()
            ->groupBy(fn($order) => $order->orderStatus?->code ?? 'unknown')
            ->map(fn($orders) => $orders->count())
            ->toArray();

        return [
            'revenue' => [
                'today' => (float) $todayRevenue,
                'yesterday' => (float) $yesterdayRevenue,
                'change_percent' => $yesterdayRevenue > 0
                    ? round((($todayRevenue - $yesterdayRevenue) / $yesterdayRevenue) * 100, 1)
                    : 0,
            ],
            'orders' => [
                'today' => $todayOrders,
                'yesterday' => $yesterdayOrders,
                'active' => $activeOrders,
                'by_status' => $ordersByStatus,
            ],
            'last_updated' => now()->toIso8601String(),
        ];
    }

    /**
     * Get recent activity feed.
     */
    public function getActivityFeed(int $limit = 10): array
    {
        $activities = [];

        // Recent orders
        $recentOrders = Order::with(['customer.user'])
            ->latest()
            ->take(5)
            ->get();

        foreach ($recentOrders as $order) {
            $activities[] = [
                'type' => 'order',
                'icon' => 'receipt',
                'message' => "Order #{$order->order_number} - " . ($order->customer?->user?->name ?? 'Guest'),
                'status' => $order->status,
                'amount' => (float) $order->total_amount,
                'timestamp' => $order->created_at->toIso8601String(),
            ];
        }

        // Recent payments
        $recentPayments = Payment::with(['invoice.order'])
            ->whereHas('paymentStatus', fn($q) => $q->where('is_successful', true))
            ->latest()
            ->take(5)
            ->get();

        foreach ($recentPayments as $payment) {
            $activities[] = [
                'type' => 'payment',
                'icon' => 'credit-card',
                'message' => "Payment received for Order #{$payment->invoice?->order?->order_number}",
                'amount' => (float) $payment->amount,
                'timestamp' => $payment->created_at->toIso8601String(),
            ];
        }

        // Sort by timestamp and limit
        usort($activities, fn($a, $b) => $b['timestamp'] <=> $a['timestamp']);
        return array_slice($activities, 0, $limit);
    }

    /**
     * Get overview of all branches for multi-branch dash context.
     */
    public function getBranchOverview(): array
    {
        $today = Carbon::today();

        return \App\Models\Location::where('is_active', true)
            ->get()
            ->map(function ($location) use ($today) {
                // We use withoutGlobalScope to ensure we get data for specific branches regardless of current session
                $stats = Order::withoutGlobalScope('branch_scope')
                    ->where('location_id', $location->id)
                    ->whereDate('created_at', $today)
                    ->selectRaw('COUNT(*) as count, SUM(total_amount) as revenue')
                    ->first();

                return [
                    'id' => $location->id,
                    'name' => $location->name,
                    'orders_today' => (int) ($stats->count ?? 0),
                    'revenue_today' => (float) ($stats->revenue ?? 0),
                    'employee_count' => Employee::withoutGlobalScope('branch_scope')
                        ->where('location_id', $location->id)
                        ->count(),
                ];
            })->toArray();
    }

    // ==================== Private Helper Methods ====================

    private function getGreeting(): string
    {
        $hour = (int) now()->format('H');
        if ($hour < 12)
            return 'Good morning';
        if ($hour < 17)
            return 'Good afternoon';
        return 'Good evening';
    }

    private function hasAnyRole(array $userRoles, array $checkRoles): bool
    {
        return !empty(array_intersect($userRoles, $checkRoles));
    }

    private function hasPermission(User $user, string $permission): bool
    {
        return $user->hasPermission($permission);
    }

    private function getSystemHealth(): array
    {
        return [
            'api' => ['status' => 'healthy', 'uptime' => '99.9%'],
            'database' => ['status' => 'healthy', 'connections' => DB::connection()->getDatabaseName() ? 'active' : 'inactive'],
            'queue' => ['status' => 'healthy', 'pending' => DB::table('jobs')->count()],
        ];
    }

    private function getCriticalAlerts(): array
    {
        $alerts = [];

        // Unacknowledged critical stock alerts
        $criticalStock = StockAlert::where('acknowledged', false)
            ->where('severity', 'critical')
            ->with('ingredient')
            ->take(5)
            ->get();

        foreach ($criticalStock as $alert) {
            $alerts[] = [
                'type' => 'stock',
                'severity' => 'critical',
                'message' => $alert->message ?? "Low stock: {$alert->ingredient?->name}",
                'action' => '/admin/stock-alerts',
            ];
        }

        return $alerts;
    }

    private function getTodayPerformance(): array
    {
        $today = Carbon::today();

        // Revenue - prefer payments, fallback to order totals
        $paymentRevenue = Payment::whereDate('created_at', $today)
            ->whereHas('paymentStatus', fn($q) => $q->where('is_successful', true))
            ->whereHas('invoice.order')
            ->sum('amount');

        $revenue = $paymentRevenue > 0
            ? (float) $paymentRevenue
            : (float) Order::whereDate('created_at', $today)
                ->where(function ($q) {
                    $q->doesntHave('orderStatus')
                        ->orWhereHas('orderStatus', fn($sq) => $sq->whereNotIn('code', ['cancelled', 'rejected']));
                })
                ->sum('total_amount');

        $orders = Order::whereDate('created_at', $today)->count();
        $completedOrders = Order::whereDate('created_at', $today)
            ->whereHas('orderStatus', fn($q) => $q->where('code', 'completed'))
            ->count();

        return [
            'revenue' => $revenue,
            'orders' => $orders,
            'completed_orders' => $completedOrders,
            'completion_rate' => $orders > 0 ? round(($completedOrders / $orders) * 100, 1) : 0,
        ];
    }

    private function getAllPendingApprovals(): array
    {
        return [
            'orders' => 0,
            'time_off' => TimeOffRequest::where('status', 'pending')->count(),
            'inventory' => InventoryAdjustment::where('status', 'pending')->count(),
        ];
    }

    private function getManagerApprovals(): array
    {
        return $this->getAllPendingApprovals();
    }

    private function getTeamOnDuty(): array
    {
        $today = Carbon::today();

        // Get employees with shifts today
        $shiftsToday = Shift::whereDate('date', $today)
            ->with(['employee.user', 'employee.position'])
            ->get();

        $byPosition = [];
        foreach ($shiftsToday as $shift) {
            $position = $shift->employee?->position?->name ?? 'Staff';
            if (!isset($byPosition[$position])) {
                $byPosition[$position] = 0;
            }
            $byPosition[$position]++;
        }

        return [
            'total' => $shiftsToday->count(),
            'by_position' => $byPosition,
        ];
    }

    private function getEmployeeTasks(User $user): array
    {
        // Get active orders assigned to this employee
        $employee = $user->employee;
        if (!$employee)
            return [];

        $activeOrders = Order::where('employee_id', $employee->id)
            ->whereHas('orderStatus', fn($q) => $q->whereIn('code', ['pending', 'received', 'preparing', 'ready']))
            ->take(5)
            ->get();

        return $activeOrders->map(fn($order) => [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'status' => $order->status,
            'table' => $order->table?->table_number,
        ])->toArray();
    }

    private function getEmployeePerformance(User $user): array
    {
        $employee = $user->employee;
        if (!$employee)
            return [];

        $thisWeek = Carbon::now()->startOfWeek();
        $ordersThisWeek = Order::where('employee_id', $employee->id)
            ->where('created_at', '>=', $thisWeek)
            ->whereHas('orderStatus', fn($q) => $q->where('code', 'completed'))
            ->count();

        return [
            'orders_this_week' => $ordersThisWeek,
        ];
    }

    private function getAdminQuickActions(): array
    {
        return [
            ['label' => 'Reports', 'icon' => 'chart-bar', 'href' => '/admin/sales-analytics'],
            ['label' => 'Users', 'icon' => 'users', 'href' => '/admin/admins'],
            ['label' => 'Settings', 'icon' => 'settings', 'href' => '/admin/settings'],
            ['label' => 'Roles', 'icon' => 'shield', 'href' => '/admin/roles'],
            ['label' => 'Audit', 'icon' => 'clipboard-list', 'href' => '/admin/audit-logs'],
        ];
    }

    private function getManagerQuickActions(): array
    {
        return [
            ['label' => 'Orders', 'icon' => 'receipt', 'href' => '/admin/orders'],
            ['label' => 'Reservations', 'icon' => 'calendar', 'href' => '/admin/reservations'],
            ['label' => 'Staff', 'icon' => 'users', 'href' => '/admin/employees'],
            ['label' => 'Reports', 'icon' => 'chart-bar', 'href' => '/admin/sales-analytics'],
            ['label' => 'Tables', 'icon' => 'grid', 'href' => '/admin/tables'],
        ];
    }

    private function getEmployeeQuickActions(): array
    {
        return [
            ['label' => 'My Orders', 'icon' => 'receipt', 'href' => '/admin/orders'],
            ['label' => 'My Schedule', 'icon' => 'calendar', 'href' => '/admin/shifts'],
            ['label' => 'Request Time Off', 'icon' => 'clock', 'href' => '/admin/time-off-requests'],
        ];
    }

    /**
     * Get revenue data by time range.
     * 
     * @param string $range 'daily' (last 7 days), 'weekly' (last 4 weeks), 'monthly' (last 6 months)
     */
    public function getRevenueByRange(string $range = 'daily'): array
    {
        $data = [];

        switch ($range) {
            case 'weekly':
                // Last 4 weeks, grouped by week
                for ($i = 3; $i >= 0; $i--) {
                    $weekStart = Carbon::now()->subWeeks($i)->startOfWeek();
                    $weekEnd = Carbon::now()->subWeeks($i)->endOfWeek();

                    $revenue = Payment::whereBetween('created_at', [$weekStart, $weekEnd])
                        ->whereHas('paymentStatus', fn($q) => $q->where('is_successful', true))
                        ->whereHas('invoice.order')
                        ->sum('amount');

                    $data[] = [
                        'date' => $weekStart->format('Y-m-d'),
                        'label' => 'Week ' . $weekStart->weekOfYear,
                        'total' => (float) $revenue,
                    ];
                }
                break;

            case 'monthly':
                // Last 6 months
                for ($i = 5; $i >= 0; $i--) {
                    $monthStart = Carbon::now()->subMonths($i)->startOfMonth();
                    $monthEnd = Carbon::now()->subMonths($i)->endOfMonth();

                    $revenue = Payment::whereBetween('created_at', [$monthStart, $monthEnd])
                        ->whereHas('paymentStatus', fn($q) => $q->where('is_successful', true))
                        ->whereHas('invoice.order')
                        ->sum('amount');

                    $data[] = [
                        'date' => $monthStart->format('Y-m-d'),
                        'label' => $monthStart->format('M Y'),
                        'total' => (float) $revenue,
                    ];
                }
                break;

            case 'daily':
            default:
                // Last 7 days
                for ($i = 6; $i >= 0; $i--) {
                    $date = Carbon::now()->subDays($i);

                    $paymentRevenue = Payment::whereDate('created_at', $date)
                        ->whereHas('paymentStatus', fn($q) => $q->where('is_successful', true))
                        ->whereHas('invoice.order')
                        ->sum('amount');

                    // Fallback to order totals if no payments found
                    $revenue = $paymentRevenue > 0
                        ? (float) $paymentRevenue
                        : (float) Order::whereDate('created_at', $date)
                            ->where(function ($q) {
                                $q->doesntHave('orderStatus')
                                    ->orWhereHas('orderStatus', fn($sq) => $sq->whereNotIn('code', ['cancelled', 'rejected']));
                            })
                            ->sum('total_amount');

                    $data[] = [
                        'date' => $date->format('Y-m-d'),
                        'label' => $date->format('M d'),
                        'total' => (float) $revenue,
                    ];
                }
                break;
        }

        return [
            'range' => $range,
            'data' => $data,
            'total' => array_sum(array_column($data, 'total')),
            'count' => count($data),
        ];
    }
}


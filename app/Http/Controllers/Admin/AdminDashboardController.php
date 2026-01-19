<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\Analytics\AnalyticsService;
use App\Services\Dashboard\DashboardDataService;
use Carbon\Carbon;

/**
 * Admin Dashboard Controller
 * 
 * Provides dashboard views and API endpoints for the redesigned
 * role-aware admin command center.
 */
class AdminDashboardController extends Controller
{
    protected $analytics;
    protected $dashboard;

    public function __construct(AnalyticsService $analytics, DashboardDataService $dashboard)
    {
        $this->analytics = $analytics;
        $this->dashboard = $dashboard;
    }

    /**
     * Main dashboard view with role-aware initial data.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $defaultDays = 7;

        return inertia('admin/Dashboard', [
            // Role-aware summary data
            'dashboardSummary' => $this->dashboard->getSummary($user),
            'alerts' => $this->dashboard->getAlerts($user),
            'quickStats' => $this->dashboard->getQuickStats(),
            'activityFeed' => $this->dashboard->getActivityFeed(8),
            
            // Legacy chart data (backwards compatible)
            'initialKPIs' => $this->analytics->getKPIs(Carbon::now()->subDays($defaultDays), Carbon::now()),
            // Use NEW dashboard service for consistent initial revenue data
            'initialRevenue' => $this->dashboard->getRevenueByRange('daily'),
            // Fetch All-Time stats for Order Status widget (start from 2000-01-01 to End of Today)
            'initialOrderStatus' => $this->analytics->getOrderStatusCounts(Carbon::create(2000, 1, 1), Carbon::now()->endOfDay()),
            'initialTopItems' => $this->analytics->getTopSellingItems(Carbon::now()->subDays($defaultDays), Carbon::now()->endOfDay()),
        ]);
    }

    /**
     * Get date-filtered analytics data (legacy endpoint).
     */
    public function getData(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $start = Carbon::parse($request->start_date);
        $end = Carbon::parse($request->end_date)->endOfDay();

        return response()->json([
            'kpis' => $this->analytics->getKPIs($start, $end),
            'revenue' => $this->analytics->getDailyRevenue($start, $end),
            'order_status' => $this->analytics->getOrderStatusCounts($start, $end),
            'top_items' => $this->analytics->getTopSellingItems($start, $end),
        ]);
    }

    // ==================== NEW API ENDPOINTS ====================

    /**
     * Get role-aware dashboard summary.
     * 
     * @api GET /api/admin/dashboard/summary
     */
    public function summary(Request $request)
    {
        return response()->json(
            $this->dashboard->getSummary($request->user())
        );
    }

    /**
     * Get pending alerts requiring attention.
     * 
     * @api GET /api/admin/dashboard/alerts
     */
    public function alerts(Request $request)
    {
        return response()->json([
            'alerts' => $this->dashboard->getAlerts($request->user()),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get real-time quick stats.
     * 
     * @api GET /api/admin/dashboard/quick-stats
     */
    public function quickStats()
    {
        return response()->json(
            $this->dashboard->getQuickStats()
        );
    }

    /**
     * Get recent activity feed.
     * 
     * @api GET /api/admin/dashboard/activity
     */
    public function activity(Request $request)
    {
        $limit = min((int) $request->get('limit', 10), 50);

        return response()->json([
            'activities' => $this->dashboard->getActivityFeed($limit),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    // ==================== LEGACY ENDPOINTS ====================

    public function analytics(Request $request)
    {
        $startDate = $request->get('start_date', Carbon::now()->subDays(30)->toDateString());
        $endDate = $request->get('end_date', Carbon::now()->toDateString());

        return response()->json([
            'kpis' => $this->analytics->getKPIs($startDate, $endDate),
            'daily_revenue' => $this->analytics->getDailyRevenue($startDate, $endDate),
            'order_status' => $this->analytics->getOrderStatusCounts($startDate, $endDate),
            'top_items' => $this->analytics->getTopSellingItems($startDate, $endDate),
        ]);
    }

    public function orderStats(Request $request)
    {
        $startDate = $request->get('start_date', Carbon::now()->subDays(30)->toDateString());
        $endDate = $request->get('end_date', Carbon::now()->toDateString());

        return response()->json([
            'status_counts' => $this->analytics->getOrderStatusCounts($startDate, $endDate),
        ]);
    }

    public function revenue(Request $request, string $period)
    {
        // Use the unified service method which handles daily/weekly/monthly logic correctly
        // and returns the format expected by the frontend { date, label, total }
        $data = $this->dashboard->getRevenueByRange($period);
        \Illuminate\Support\Facades\Log::info("Revenue API ($period):", $data);

        return response()->json($data);
    }

    /**
     * Get revenue data by time range using DashboardDataService.
     * 
     * @api GET /api/admin/dashboard/revenue
     */
    public function revenueByRange(Request $request)
    {
        $range = $request->get('range', 'daily');
        
        if (!in_array($range, ['daily', 'weekly', 'monthly'])) {
            $range = 'daily';
        }

        return response()->json(
            $this->dashboard->getRevenueByRange($range)
        );
    }
}

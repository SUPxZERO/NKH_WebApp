<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Services\Analytics\AnalyticsService;

use Carbon\Carbon;

class AdminDashboardController extends Controller
{
    protected $analytics;

    public function __construct(AnalyticsService $analytics)
    {
        $this->analytics = $analytics;
    }

    public function index()
    {
        return inertia('Admin/Dashboard', [
            // Initial data for page load (default to last 7 days)
            'initialKPIs' => $this->analytics->getKPIs(Carbon::now()->subDays(7), Carbon::now()),
            'initialRevenue' => $this->analytics->getDailyRevenue(Carbon::now()->subDays(7), Carbon::now()),
            'initialOrderStatus' => $this->analytics->getOrderStatusCounts(Carbon::now()->subDays(7), Carbon::now()),
            'initialTopItems' => $this->analytics->getTopSellingItems(Carbon::now()->subDays(7), Carbon::now()),
        ]);
    }

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
}

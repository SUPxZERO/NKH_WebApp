<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    protected AnalyticsService $analyticsService;

    public function __construct(AnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    /**
     * Get sales trends over time
     */
    public function salesTrends(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'location_id' => 'nullable|exists:locations,id',
        ]);

        $startDate = $request->input('start_date', Carbon::now()->subDays(30)->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->toDateString());
        $locationId = $request->input('location_id') ? (int) $request->input('location_id') : null;

        $cacheKey = "analytics_sales_trends_{$startDate}_{$endDate}_{$locationId}";

        $data = cache()->remember($cacheKey, 300, function () use ($startDate, $endDate, $locationId) {
            return $this->analyticsService->getSalesTrends($startDate, $endDate, $locationId);
        });

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * Get top selling products
     */
    public function topProducts(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'location_id' => 'nullable|exists:locations,id',
            'limit' => 'nullable|integer|min:1|max:50'
        ]);

        $startDate = $request->input('start_date', Carbon::now()->subDays(30)->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->toDateString());
        $locationId = $request->input('location_id') ? (int) $request->input('location_id') : null;
        $limit = $request->input('limit', 10);

        $cacheKey = "analytics_top_products_{$startDate}_{$endDate}_{$locationId}_{$limit}";

        $data = cache()->remember($cacheKey, 300, function () use ($limit, $startDate, $endDate, $locationId) {
            return $this->analyticsService->getTopProducts($limit, $startDate, $endDate, $locationId);
        });

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * Get customer insights
     */
    public function customerInsights(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'location_id' => 'nullable|exists:locations,id',
        ]);

        $startDate = $request->input('start_date', Carbon::now()->subDays(30)->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->toDateString());
        $locationId = $request->input('location_id') ? (int) $request->input('location_id') : null;

        $cacheKey = "analytics_customer_insights_{$startDate}_{$endDate}_{$locationId}";

        $data = cache()->remember($cacheKey, 600, function () use ($startDate, $endDate, $locationId) {
            return $this->analyticsService->getCustomerInsights($startDate, $endDate, $locationId);
        });

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }
}

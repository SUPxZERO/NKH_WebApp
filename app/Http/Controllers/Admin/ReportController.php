<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Order;
use App\Models\Ingredient;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Generate and download the Sales Report PDF.
     */
    public function sales(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());

        $orders = Order::with(['items', 'customer'])
            ->whereBetween('created_at', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay()
            ])
            ->where('status', 'completed') // Only completed orders
            ->orderBy('created_at', 'desc')
            ->get();

        $totalRevenue = $orders->sum('total_amount');
        $totalOrders = $orders->count();

        $pdf = Pdf::loadView('admin.reports.sales', [
            'orders' => $orders,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'totalRevenue' => $totalRevenue,
            'totalOrders' => $totalOrders,
        ]);

        return $pdf->download("sales_report_{$startDate}_to_{$endDate}.pdf");
    }

    /**
     * Generate and download the Inventory Report PDF.
     */
    public function inventory(Request $request)
    {
        // Fetch all ingredients, optionally filtered by low stock
        $showLowStockOnly = $request->boolean('low_stock');

        $query = Ingredient::query();

        if ($showLowStockOnly) {
            $query->whereColumn('current_stock', '<=', 'min_stock_level');
        }

        $ingredients = $query->orderBy('name')->get();

        $totalValue = $ingredients->sum(function ($item) {
            return $item->current_stock * $item->cost_per_unit;
        });

        $pdf = Pdf::loadView('admin.reports.inventory', [
            'ingredients' => $ingredients,
            'totalValue' => $totalValue,
            'filter' => $showLowStockOnly ? 'Low Stock Items' : 'All Inventory',
            'generatedAt' => Carbon::now()->format('Y-m-d H:i:s'),
        ]);

        return $pdf->download('inventory_report.pdf');
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockAlert;
use App\Models\Ingredient;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StockAlertController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Trigger alert generation (simplified for demo)
        $this->generateAlerts();

        $query = StockAlert::with(['ingredient', 'location'])
            ->where('acknowledged', false);

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->filled('severity') && $request->severity !== 'all') {
            $query->where('severity', $request->severity);
        }

        $alerts = $query->orderBy('created_at', 'desc')->get();

        return response()->json($alerts);
    }

    public function acknowledge(Request $request, StockAlert $alert): JsonResponse
    {
        $alert->update([
            'acknowledged' => true,
            'acknowledged_at' => now(),
            'acknowledged_by' => auth()->id() ?? 1
        ]);

        return response()->json(['message' => 'Alert acknowledged']);
    }

    public function reorderRecommendations(): JsonResponse
    {
        // Find ingredients where current_stock <= reorder_point
        $recommendations = Ingredient::with('supplier')
            ->whereRaw('current_stock <= reorder_point')
            ->get()
            ->map(function ($ingredient) {
                return [
                    'id' => $ingredient->id,
                    'name' => $ingredient->name,
                    'current_stock' => $ingredient->current_stock,
                    'reorder_point' => $ingredient->reorder_point,
                    'max_stock_level' => $ingredient->max_stock_level,
                    'suggested_quantity' => max(0, $ingredient->max_stock_level - $ingredient->current_stock),
                    'supplier' => $ingredient->supplier
                ];
            });

        return response()->json($recommendations);
    }

    public function updateThresholds(Request $request, Ingredient $ingredient): JsonResponse
    {
        $validated = $request->validate([
            'min_stock_level' => 'nullable|numeric',
            'max_stock_level' => 'nullable|numeric',
            'reorder_point' => 'nullable|numeric'
        ]);

        $ingredient->update($validated);

        return response()->json(['message' => 'Thresholds updated']);
    }

    public function stats(): JsonResponse
    {
        $activeAlerts = StockAlert::where('acknowledged', false)->count();
        $critical = StockAlert::where('acknowledged', false)->where('severity', 'high')->count();
        $expiring = StockAlert::where('acknowledged', false)->where('type', 'expiring_soon')->count();

        return response()->json([
            'active_alerts' => $activeAlerts,
            'critical' => $critical,
            'expiring' => $expiring
        ]);
    }

    private function generateAlerts()
    {
        // 1. Check Low Stock (Global)
        $lowStockIngredients = Ingredient::whereRaw('current_stock <= reorder_point')->get();

        foreach ($lowStockIngredients as $ingredient) {
            // Check if alert already exists
            $exists = StockAlert::where('ingredient_id', $ingredient->id)
                ->where('type', 'low_stock')
                ->where('acknowledged', false)
                ->exists();

            if (!$exists) {
                StockAlert::create([
                    'type' => 'low_stock',
                    'ingredient_id' => $ingredient->id,
                    'severity' => 'medium',
                    'message' => "Stock level ({$ingredient->current_stock}) is below reorder point ({$ingredient->reorder_point})"
                ]);
            }
        }

        // 2. Check Critical Stock (Global)
        $criticalIngredients = Ingredient::whereRaw('current_stock <= min_stock_level')->get();

        foreach ($criticalIngredients as $ingredient) {
            $exists = StockAlert::where('ingredient_id', $ingredient->id)
                ->where('type', 'critical_stock')
                ->where('acknowledged', false)
                ->exists();

            if (!$exists) {
                StockAlert::create([
                    'type' => 'critical_stock',
                    'ingredient_id' => $ingredient->id,
                    'severity' => 'high',
                    'message' => "Stock level ({$ingredient->current_stock}) is critically low (Min: {$ingredient->min_stock_level})"
                ]);
            }
        }

        // 3. Check Expiring Inventory (Per Location)
        $expiringInventory = Inventory::where('expiration_date', '<=', now()->addDays(7))
            ->where('expiration_date', '>=', now())
            ->get();

        foreach ($expiringInventory as $inv) {
            $exists = StockAlert::where('ingredient_id', $inv->ingredient_id)
                ->where('location_id', $inv->location_id)
                ->where('type', 'expiring_soon')
                ->where('acknowledged', false)
                ->exists();

            if (!$exists) {
                StockAlert::create([
                    'type' => 'expiring_soon',
                    'ingredient_id' => $inv->ingredient_id,
                    'location_id' => $inv->location_id,
                    'severity' => 'medium',
                    'message' => "Batch {$inv->batch_number} expires on {$inv->expiration_date->format('Y-m-d')}"
                ]);
            }
        }
    }
}

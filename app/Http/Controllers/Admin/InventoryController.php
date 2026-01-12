<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ingredient;
use App\Models\InventoryTransaction;
use App\Services\Inventory\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class InventoryController extends Controller
{
    protected $inventory;

    public function __construct(InventoryService $inventory)
    {
        $this->inventory = $inventory;
    }

    public function index()
    {
        return Inertia::render('Admin/Inventory/Index', [
            'ingredients' => Ingredient::with(['unit', 'supplier', 'location'])
                ->orderBy('name')
                ->paginate(20),
        ]);
    }

    public function adjust(Request $request)
    {
        $request->validate([
            'ingredient_id' => 'required|exists:ingredients,id',
            'quantity' => 'required|numeric|not_in:0',
            'reason' => 'nullable|string|max:255',
            'type' => 'required|in:' . implode(',', [
                InventoryTransaction::TYPE_ADJUSTMENT,
                InventoryTransaction::TYPE_PURCHASE,
                InventoryTransaction::TYPE_RETURN
            ]),
        ]);

        $ingredient = Ingredient::findOrFail($request->ingredient_id);

        try {
            $this->inventory->adjustStock(
                $ingredient,
                $request->quantity,
                $request->type,
                $request->reason,
                Auth::user()
            );

            return back()->with('success', 'Stock adjusted successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to adjust stock: ' . $e->getMessage());
        }
    }

    public function wastage(Request $request)
    {
        $request->validate([
            'ingredient_id' => 'required|exists:ingredients,id',
            'quantity' => 'required|numeric|min:0.01',
            'reason' => 'required|string|max:255',
        ]);

        $ingredient = Ingredient::findOrFail($request->ingredient_id);

        try {
            $this->inventory->recordWastage(
                $ingredient,
                $request->quantity,
                $request->reason,
                Auth::user()
            );

            return back()->with('success', 'Wastage recorded successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to record wastage: ' . $e->getMessage());
        }
    }
}

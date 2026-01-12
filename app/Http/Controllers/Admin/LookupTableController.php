<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class LookupTableController extends Controller
{
    public function index()
    {
        return inertia('Admin/Configuration/Index', [
            'orderTypes' => \App\Models\OrderType::orderBy('display_order')->get(),
            'orderStatuses' => \App\Models\OrderStatus::orderBy('display_order')->get(),
            'paymentStatuses' => \App\Models\PaymentStatus::orderBy('display_order')->get(),
            'loyaltyTiers' => \App\Models\LoyaltyTier::orderBy('display_order')->get(),
        ]);
    }

    public function updateOrderType(Request $request, \App\Models\OrderType $orderType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20',
            'allows_delivery' => 'boolean',
            'allows_table' => 'boolean',
            'allows_pickup' => 'boolean',
            'is_active' => 'boolean',
            'display_order' => 'integer',
        ]);

        $orderType->update($validated);
        return back()->with('success', 'Order type updated successfully');
    }

    public function updateOrderStatus(Request $request, \App\Models\OrderStatus $orderStatus)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20',
            'is_terminal' => 'boolean',
            'workflow_position' => 'integer',
            'show_to_customer' => 'boolean',
            'is_active' => 'boolean',
            'display_order' => 'integer',
        ]);

        $orderStatus->update($validated);
        return back()->with('success', 'Order status updated successfully');
    }

    public function updatePaymentStatus(Request $request, \App\Models\PaymentStatus $paymentStatus)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20',
            'is_successful' => 'boolean',
            'is_terminal' => 'boolean',
            'is_active' => 'boolean',
            'display_order' => 'integer',
        ]);

        $paymentStatus->update($validated);
        return back()->with('success', 'Payment status updated successfully');
    }

    public function updateLoyaltyTier(Request $request, \App\Models\LoyaltyTier $loyaltyTier)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20',
            'min_spent' => 'required|numeric|min:0',
            'max_spent' => 'nullable|numeric|gt:min_spent',
            'discount_percent' => 'numeric|min:0|max:100',
            'points_multiplier' => 'numeric|min:0',
            'is_active' => 'boolean',
            'display_order' => 'integer',
        ]);

        $loyaltyTier->update($validated);
        return back()->with('success', 'Loyalty tier updated successfully');
    }
}

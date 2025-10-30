<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use Inertia\Inertia;

class CustomerRequestController extends Controller
{
    public function index(Request $request)
    {
        $orders = Order::with(['customer.user'])
            ->where('approval_status', 'pending')
            ->orderBy('ordered_at', 'desc')
            ->get();

        // Return JSON for API requests, Inertia for web requests
        if ($request->wantsJson()) {
            return response()->json(['orders' => $orders]);
        }

        return Inertia::render('admin/CustomerRequests', ['orders' => $orders]);
    }

    public function show($id) 
    { 
        return response()->json(['message' => 'Not implemented']); 
    }

    public function update(Request $request, $id) 
    { 
        return response()->json(['message' => 'Not implemented']); 
    }
}

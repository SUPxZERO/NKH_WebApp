<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use Inertia\Inertia;

class CustomerRequestController extends Controller
{

public function index()
    {
        $orders = Order::with(['customer.user'])
            ->where('approval_status', 'pending')
            ->orderBy('placed_at', 'desc')
            ->get();

        return Inertia::render('Admin/CustomerRequests', ['orders' => $orders]);
    }
    public function show($id) { return response()->json(['message' => 'Not implemented']); }
    public function update(Request $request, $id) { return response()->json(['message' => 'Not implemented']); }
}

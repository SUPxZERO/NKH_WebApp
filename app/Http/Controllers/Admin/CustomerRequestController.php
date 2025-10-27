<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CustomerRequest;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CustomerRequestController extends Controller
{
    public function index(): Response
    {
        $orders = Order::with(['customer.user'])
            ->where('approval_status', Order::APPROVAL_STATUS_PENDING)
            ->where(function($query) {
                $query->where('order_type', 'delivery')
                      ->orWhere('order_type', 'pickup');
            })
            ->latest()
            ->get();

        return Inertia::render('Admin/CustomerRequests', [
            'orders' => $orders
        ]);
    }

    public function approve(CustomerRequest $request)
    {
        $order = $request->order;
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $order->approval_status = Order::APPROVAL_STATUS_APPROVED;
        $order->save();

        $request->status = 'approved';
        $request->save();

        return response()->json(['message' => 'Request approved successfully']);
    }

    public function reject(CustomerRequest $request, Request $rejectRequest)
    {
        $order = $request->order;
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $order->approval_status = Order::APPROVAL_STATUS_REJECTED;
        $order->rejection_reason = $rejectRequest->input('rejection_reason');
        $order->save();

        $request->status = 'rejected';
        $request->rejection_reason = $rejectRequest->input('rejection_reason');
        $request->save();

        return response()->json(['message' => 'Request rejected successfully']);
    }
}
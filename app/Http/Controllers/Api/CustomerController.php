<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerResource;
use App\Http\Resources\OrderResource;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CustomerController extends Controller
{
    // GET /api/customers (role:admin,manager)
    public function index(): AnonymousResourceCollection
    {
        $customers = Customer::query()->with(['user'])->paginate();
        return CustomerResource::collection($customers);
    }

    // GET /api/customer/profile (auth:sanctum, role:customer)
    public function profile(Request $request): CustomerResource
    {
        $customer = $request->user()->customer;
        abort_if(!$customer, 404, 'Customer profile not found.');
        return new CustomerResource($customer->load(['user']));
    }

    // GET /api/customer/orders (auth:sanctum, role:customer)
    public function orders(Request $request): AnonymousResourceCollection
    {
        $customer = $request->user()->customer;
        abort_if(!$customer, 404, 'Customer profile not found.');
        $orders = $customer->orders()->latest()->paginate();
        return OrderResource::collection($orders);
    }

    // GET /api/customer/loyalty-points (auth:sanctum, role:customer)
    public function loyaltyPoints(Request $request): JsonResponse
    {
        $customer = $request->user()->customer;
        abort_if(!$customer, 404, 'Customer profile not found.');

        // Column is points_balance in current schema; exposed as loyalty_points
        return response()->json([
            'data' => [
                'loyalty_points' => (int) ($customer->points_balance ?? 0),
            ],
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Customer\StoreCustomerRequest;
use App\Http\Requests\Api\Customer\UpdateCustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Http\Resources\OrderResource;
use App\Models\Customer;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CustomerController extends Controller
{
    // GET /api/admin/customers (role:admin,manager)
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Customer::query()->with(['user', 'preferredLocation', 'addresses']);
        
        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }
        
        // Filter by location if provided
        if ($request->has('location_id')) {
            $query->where('preferred_location_id', $request->location_id);
        }
        
        $customers = $query->paginate($request->get('per_page', 15));
        return CustomerResource::collection($customers);
    }

    // POST /api/admin/customers (role:admin,manager)
    public function store(StoreCustomerRequest $request): CustomerResource
    {
        $data = $request->validated();
        
        $customer = DB::transaction(function () use ($data) {
            // Create user account
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => Hash::make($data['password']),
                'is_active' => $data['is_active'] ?? true,
            ]);
            
            // Assign customer role
            $role = Role::where('slug', 'customer')->firstOrFail();
            $user->roles()->attach($role->id);
            
            // Create customer record
            $customer = Customer::create([
                'user_id' => $user->id,
                'customer_code' => 'CUST-'.strtoupper(Str::random(6)),
                'preferred_location_id' => $data['preferred_location_id'] ?? null,
                'birth_date' => $data['birth_date'] ?? null,
                'gender' => $data['gender'] ?? null,
                'preferences' => $data['preferences'] ?? null,
                'points_balance' => $data['points_balance'] ?? 0,
                'notes' => $data['notes'] ?? null,
            ]);
            
            return $customer->load(['user', 'preferredLocation', 'addresses']);
        });
        
        return new CustomerResource($customer);
    }

    // GET /api/admin/customers/{customer} (role:admin,manager)
    public function show(Customer $customer): CustomerResource
    {
        return new CustomerResource($customer->load(['user', 'preferredLocation', 'addresses']));
    }

    // PUT /api/admin/customers/{customer} (role:admin,manager)
    public function update(UpdateCustomerRequest $request, Customer $customer): CustomerResource
    {
        $data = $request->validated();
        
        DB::transaction(function () use ($customer, $data) {
            // Update user information
            if (isset($data['name']) || isset($data['email']) || isset($data['phone'])) {
                $userUpdate = [];
                if (isset($data['name'])) $userUpdate['name'] = $data['name'];
                if (isset($data['email'])) $userUpdate['email'] = $data['email'];
                if (isset($data['phone'])) $userUpdate['phone'] = $data['phone'];
                if (isset($data['is_active'])) $userUpdate['is_active'] = $data['is_active'];
                
                $customer->user()->update($userUpdate);
            }
            
            // Update password if provided
            if (isset($data['password'])) {
                $customer->user()->update(['password' => Hash::make($data['password'])]);
            }
            
            // Update customer record
            $customerUpdate = [];
            if (isset($data['preferred_location_id'])) $customerUpdate['preferred_location_id'] = $data['preferred_location_id'];
            if (isset($data['birth_date'])) $customerUpdate['birth_date'] = $data['birth_date'];
            if (isset($data['gender'])) $customerUpdate['gender'] = $data['gender'];
            if (isset($data['preferences'])) $customerUpdate['preferences'] = $data['preferences'];
            if (isset($data['points_balance'])) $customerUpdate['points_balance'] = $data['points_balance'];
            if (isset($data['notes'])) $customerUpdate['notes'] = $data['notes'];
            
            if (!empty($customerUpdate)) {
                $customer->update($customerUpdate);
            }
        });
        
        return new CustomerResource($customer->fresh(['user', 'preferredLocation', 'addresses']));
    }

    // DELETE /api/admin/customers/{customer} (role:admin,manager)
    public function destroy(Customer $customer): JsonResponse
    {
        DB::transaction(function () use ($customer) {
            // Deactivate instead of hard delete to preserve data integrity
            $customer->user()->update(['is_active' => false]);
        });
        
        return response()->json(['message' => 'Customer deactivated successfully.']);
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

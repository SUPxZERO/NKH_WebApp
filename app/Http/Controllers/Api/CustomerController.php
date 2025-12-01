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

    // GET /api/customers/{customer}/history - Get customer activity history
    public function history(Customer $customer): JsonResponse
    {
        $history = [
            'orders' => $customer->orders()
                ->with(['items', 'location'])
                ->latest()
                ->limit(50)
                ->get(),
            'reservations' => $customer->reservations()
                ->with(['location', 'table'])
                ->latest()
                ->limit(20)
                ->get(),
            'loyalty_transactions' => $customer->loyaltyPoints()
                ->latest('occurred_at')
                ->limit(100)
                ->get(),
            'feedback' => $customer->feedback()
                ->with(['order', 'location'])
                ->latest()
                ->get(),
        ];

        return response()->json(['data' => $history]);
    }

    // GET /api/customers/{customer}/stats - Get customer statistics
    public function stats(Customer $customer): JsonResponse
    {
        $stats = [
            'total_orders' => $customer->orders()->count(),
            'total_spent' => $customer->total_spent,
            'average_order_value' => $customer->average_order_value,
            'visit_count' => $customer->visit_count,
            'last_visit_date' => $customer->last_visit_date,
            'last_purchase_date' => $customer->last_purchase_date,
            'customer_tier' => $customer->customer_tier,
            'points_balance' => $customer->points_balance,
            'no_show_count' => $customer->no_show_count,
            'favorite_items' => $customer->orders()
                ->join('order_items',' orders.id', '=', 'order_items.order_id')
                ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
                ->select('menu_items.id', 'menu_items.name', DB::raw('COUNT(*) as order_count'))
                ->groupBy('menu_items.id', 'menu_items.name')
                ->orderByDesc('order_count')
                ->limit(5)
                ->get(),
            'preferred_location' => $customer->preferredLocation,
        ];

        return response()->json(['data' => $stats]);
    }

    // POST /api/customers/{customer}/update-tier - Manually update customer tier
    public function updateTier(Customer $customer): JsonResponse
    {
        $customer->updateEngagementMetrics();
        
        return response()->json([
            'message' => 'Customer tier updated successfully',
            'data' => [
                'customer_tier' => $customer->fresh()->customer_tier,
                'total_spent' => $customer->total_spent,
            ]
        ]);
    }

    // GET /api/customer/addresses - Get customer addresses
    public function getAddresses(Request $request): JsonResponse
    {
        $customer = $request->user()->customer;
        abort_if(!$customer, 404, 'Customer profile not found.');
        
        $addresses = $customer->addresses()->get();
        return response()->json(['data' => $addresses]);
    }

    // POST /api/customer/addresses - Add new address
    public function storeAddress(Request $request): JsonResponse
    {
        $customer = $request->user()->customer;
        abort_if(!$customer, 404, 'Customer profile not found.');

        $validated = $request->validate([
            'label' => 'required|string|max:100',
            'address_line_1' => 'required|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'city' => 'required|string|max:120',
            'province' => 'required|string|max:120',
            'postal_code' => 'required|string|max:20',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'delivery_instructions' => 'nullable|string',
            'is_default' => 'boolean',
        ]);

        // If setting as default, unset other defaults
        if ($validated['is_default'] ?? false) {
            $customer->addresses()->update(['is_default' => false]);
        }

        $address = $customer->addresses()->create($validated);

        return response()->json([
            'message' => 'Address added successfully',
            'data' => $address
        ], 201);
    }

    // PUT /api/customer/addresses/{address} - Update address
    public function updateAddress(Request $request, $addressId): JsonResponse
    {
        $customer = $request->user()->customer;
        abort_if(!$customer, 404, 'Customer profile not found.');

        $address = $customer->addresses()->findOrFail($addressId);

        $validated = $request->validate([
            'label' => 'string|max:100',
            'address_line_1' => 'string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'city' => 'string|max:120',
            'province' => 'string|max:120',
            'postal_code' => 'string|max:20',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'delivery_instructions' => 'nullable|string',
            'is_default' => 'boolean',
        ]);

        // If setting as default, unset other defaults
        if (($validated['is_default'] ?? false) && !$address->is_default) {
            $customer->addresses()->update(['is_default' => false]);
        }

        $address->update($validated);

        return response()->json([
            'message' => 'Address updated successfully',
            'data' => $address
        ]);
    }

    // DELETE /api/customer/addresses/{address} - Delete address
    public function destroyAddress(Request $request, $addressId): JsonResponse
    {
        $customer = $request->user()->customer;
        abort_if(!$customer, 404, 'Customer profile not found.');

        $address = $customer->addresses()->findOrFail($addressId);
        $address->delete();

        return response()->json(['message' => 'Address deleted successfully']);
    }

    // POST /api/customer/addresses/{address}/set-default - Mark address as default
    public function setDefaultAddress(Request $request, $addressId): JsonResponse
    {
        $customer = $request->user()->customer;
        abort_if(!$customer, 404, 'Customer profile not found.');

        $address = $customer->addresses()->findOrFail($addressId);
        
        // Unset all defaults
        $customer->addresses()->update(['is_default' => false]);
        
        // Set this one as default
        $address->update(['is_default' => true]);

        return response()->json([
            'message' => 'Default address set successfully',
            'data' => $address
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Middleware\TelegramWebAppAuth;
use App\Http\Requests\Api\Customer\StoreCustomerRequest;
use App\Http\Requests\Api\Customer\UpdateCustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Http\Resources\OrderResource;
use App\Models\Customer;
use App\Models\TelegramUser;
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
    /**
     * Get customer from authenticated user OR from Telegram session
     * Returns [Customer|null, TelegramUser|null, error_message|null]
     */
    private function getCustomerOrTelegram(Request $request): array
    {
        // First check if user is authenticated via Laravel
        if ($request->user() && $request->user()->customer) {
            return [$request->user()->customer, null, null];
        }

        // Check for any Telegram session (guest or webapp)
        $telegramUserId = session('telegram_user_id');
        $telegramData = session('telegram_user');
        
        // Try to get telegram_id from either source
        $telegramId = $telegramUserId ?? ($telegramData['telegram_id'] ?? null);
        
        if ($telegramId) {
            $telegramUser = TelegramUser::where('telegram_id', $telegramId)->first();
            
            if ($telegramUser) {
                // If Telegram user has a linked customer, use that
                if ($telegramUser->customer_id) {
                    $customer = Customer::find($telegramUser->customer_id);
                    if ($customer) {
                        return [$customer, $telegramUser, null];
                    }
                }
                
                // Return TelegramUser for guest operations
                return [null, $telegramUser, null];
            }
        }

        return [null, null, 'Customer profile not found. Please login or use Telegram.'];
    }

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
    // UPDATED: Supports both Auth and Telegram guests
    public function profile(Request $request): CustomerResource
    {
        [$customer, $telegramUser, $error] = $this->getCustomerOrTelegram($request);
        abort_if(!$customer, 404, $error ?? 'Customer profile not found.');
        return new CustomerResource($customer->load(['user']));
    }

    // PUT /api/customer/profile (auth, role:customer) - Update own profile
    // UPDATED: Supports both Auth and Telegram guests via getCustomerOrTelegram
    public function updateProfile(Request $request): JsonResponse
    {
        [$customer, $telegramUser, $error] = $this->getCustomerOrTelegram($request);
        abort_if(!$customer, 404, $error ?? 'Customer profile not found.');

        // Build validation rules - email uniqueness check needs user_id if available
        $userId = $customer->user_id ?? 0;
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,' . $userId,
            'phone' => 'nullable|string|max:20',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|string|in:male,female,other',
            'preferred_language' => 'nullable|string|in:en,km',
            'marketing_consent' => 'nullable|boolean',
        ]);

        DB::transaction(function () use ($customer, $telegramUser, $validated) {
            // Update user table fields (only if customer has a linked User)
            if ($customer->user) {
                $userUpdate = [];
                if (isset($validated['name'])) $userUpdate['name'] = $validated['name'];
                if (isset($validated['email'])) $userUpdate['email'] = $validated['email'];
                if (isset($validated['phone'])) $userUpdate['phone'] = $validated['phone'];

                if (!empty($userUpdate)) {
                    $customer->user()->update($userUpdate);
                }
            } elseif ($telegramUser) {
                // For Telegram guests, update TelegramUser record
                $telegramUpdate = [];
                if (isset($validated['name'])) {
                    $names = explode(' ', $validated['name'], 2);
                    $telegramUpdate['first_name'] = $names[0];
                    if (isset($names[1])) $telegramUpdate['last_name'] = $names[1];
                }
                if (isset($validated['phone'])) $telegramUpdate['phone_number'] = $validated['phone'];
                
                if (!empty($telegramUpdate)) {
                    $telegramUser->update($telegramUpdate);
                }
            }

            // Update customer table fields (works for both auth types)
            $customerUpdate = [];
            if (isset($validated['name'])) $customerUpdate['name'] = $validated['name'];
            if (isset($validated['email'])) $customerUpdate['email'] = $validated['email'];
            if (isset($validated['phone'])) $customerUpdate['phone'] = $validated['phone'];
            if (isset($validated['birth_date'])) $customerUpdate['birth_date'] = $validated['birth_date'];
            if (isset($validated['gender'])) $customerUpdate['gender'] = $validated['gender'];
            if (isset($validated['preferred_language'])) $customerUpdate['preferred_language'] = $validated['preferred_language'];
            if (isset($validated['marketing_consent'])) $customerUpdate['marketing_consent'] = $validated['marketing_consent'];

            if (!empty($customerUpdate)) {
                $customer->update($customerUpdate);
            }
        });

        return response()->json([
            'message' => 'Profile updated successfully',
            'data' => new CustomerResource($customer->fresh(['user']))
        ]);
    }

    // GET /api/customer/orders (auth:sanctum, role:customer)
    // UPDATED: Supports both Auth and Telegram guests
    public function orders(Request $request): AnonymousResourceCollection
    {
        [$customer, $telegramUser, $error] = $this->getCustomerOrTelegram($request);
        abort_if(!$customer, 404, $error ?? 'Customer profile not found.');
        $orders = $customer->orders()->latest()->paginate();
        return OrderResource::collection($orders);
    }

    // GET /api/customer/loyalty-points (auth:sanctum, role:customer)
    // UPDATED: Supports both Auth and Telegram guests
    public function loyaltyPoints(Request $request): JsonResponse
    {
        [$customer, $telegramUser, $error] = $this->getCustomerOrTelegram($request);
        abort_if(!$customer, 404, $error ?? 'Customer profile not found.');

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
        [$customer, $telegramUser, $error] = $this->getCustomerOrTelegram($request);
        
        // For Telegram guests without customer account, return empty addresses
        // They can still place orders with address entered at checkout
        if (!$customer && $telegramUser) {
            return response()->json([
                'data' => [],
                'telegram_guest' => true,
                'message' => 'Telegram guests can enter address during checkout',
            ]);
        }
        
        abort_if(!$customer, 404, $error ?? 'Customer profile not found.');
        
        $addresses = $customer->addresses()->get();
        return response()->json(['data' => $addresses]);
    }

    // POST /api/customer/addresses - Add new address
    public function storeAddress(Request $request): JsonResponse
    {
        [$customer, $telegramUser, $error] = $this->getCustomerOrTelegram($request);
        
        // For Telegram guests without customer account, store address in session for checkout
        if (!$customer && $telegramUser) {
            $validated = $request->validate([
                'label' => 'required|string|max:100',
                'address_line_1' => 'required|string|max:255',
                'address_line_2' => 'nullable|string|max:255',
                'city' => 'required|string|max:120',
                'province' => 'required|string|max:120',
                'postal_code' => 'required|string|max:20',
                'delivery_instructions' => 'nullable|string',
            ]);

            // Store in session for use during checkout
            $sessionAddresses = session('telegram_guest_addresses', []);
            $validated['id'] = count($sessionAddresses) + 1;
            $validated['is_default'] = count($sessionAddresses) === 0;
            $sessionAddresses[] = $validated;
            session(['telegram_guest_addresses' => $sessionAddresses]);

            // Also update TelegramUser delivery_address
            $telegramUser->update([
                'delivery_address' => $validated['address_line_1'] . ', ' . $validated['city'],
            ]);

            return response()->json([
                'message' => 'Address saved for checkout',
                'data' => $validated,
                'telegram_guest' => true,
            ], 201);
        }
        
        abort_if(!$customer, 404, $error ?? 'Customer profile not found.');

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
    // UPDATED: Supports both Auth and Telegram guests
    public function updateAddress(Request $request, $addressId): JsonResponse
    {
        [$customer, $telegramUser, $error] = $this->getCustomerOrTelegram($request);
        abort_if(!$customer, 404, $error ?? 'Customer profile not found.');

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
    // UPDATED: Supports both Auth and Telegram guests
    public function destroyAddress(Request $request, $addressId): JsonResponse
    {
        [$customer, $telegramUser, $error] = $this->getCustomerOrTelegram($request);
        abort_if(!$customer, 404, $error ?? 'Customer profile not found.');

        $address = $customer->addresses()->findOrFail($addressId);
        $address->delete();

        return response()->json(['message' => 'Address deleted successfully']);
    }

    // POST /api/customer/addresses/{address}/set-default - Mark address as default
    // UPDATED: Supports both Auth and Telegram guests
    public function setDefaultAddress(Request $request, $addressId): JsonResponse
    {
        [$customer, $telegramUser, $error] = $this->getCustomerOrTelegram($request);
        abort_if(!$customer, 404, $error ?? 'Customer profile not found.');

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

    // GET /api/customer/stats - Get authenticated customer's statistics
    // UPDATED: Supports both Auth and Telegram guests
    public function customerStats(Request $request): JsonResponse
    {
        [$customer, $telegramUser, $error] = $this->getCustomerOrTelegram($request);
        abort_if(!$customer, 404, $error ?? 'Customer profile not found.');

        $stats = [
            'total_orders' => $customer->orders()->count(),
            'total_spent' => $customer->total_spent ?? 0,
            'average_order_value' => $customer->average_order_value ?? 0,
            'visit_count' => $customer->visit_count ?? 0,
            'last_visit_date' => $customer->last_visit_date,
            'last_purchase_date' => $customer->last_purchase_date,
            'customer_tier' => $customer->customer_tier ?? 'bronze',
            'points_balance' => $customer->points_balance ?? 0,
            'no_show_count' => $customer->no_show_count ?? 0,
            'favorite_items' => $customer->orders()
                ->join('order_items', 'orders.id', '=', 'order_items.order_id')
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

    // GET /api/customer/history - Get authenticated customer's activity history
    // UPDATED: Supports both Auth and Telegram guests
    public function customerHistory(Request $request): JsonResponse
    {
        [$customer, $telegramUser, $error] = $this->getCustomerOrTelegram($request);
        abort_if(!$customer, 404, $error ?? 'Customer profile not found.');

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

    // GET /api/admin/customer-stats - Admin aggregate stats
    public function aggregateStats(): JsonResponse
    {
        $total = Customer::count();
        $active = Customer::whereHas('user', function($q) {
            $q->where('is_active', true);
        })->count();
        $vip = Customer::where('customer_tier', 'gold')
            ->orWhere('customer_tier', 'platinum')
            ->count();
        $newThisMonth = Customer::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        return response()->json([
            'total' => $total,
            'active' => $active,
            'vip' => $vip,
            'new_this_month' => $newThisMonth,
        ]);
    }
}

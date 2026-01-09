<?php

namespace App\Http\Controllers\Api\Telegram;

use App\Http\Controllers\Controller;
use App\Models\CustomerAddress;
use App\Models\TelegramUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TelegramAccountController extends Controller
{
    /**
     * Get current user info
     * 
     * SPRINT P16: All Telegram users now have auto-created Customer records,
     * so customer data is always available.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user('telegram');

        if (!$user) {
            return response()->json([
                'success' => false,
                'error' => 'Not authenticated',
            ], 401);
        }

        // P16: Ensure customer exists (backfill if somehow missing)
        if (!$user->customer_id) {
            // Trigger backfill by refreshing via findOrCreate
            $user = \App\Models\TelegramUser::findOrCreate(['id' => $user->telegram_id]);
        }

        $customer = $user->customer;

        $data = [
            'id' => $user->id,
            'telegram_id' => $user->telegram_id,
            'telegram_username' => $user->telegram_username,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'display_name' => $user->display_name,
            'phone_number' => $user->phone_number,
            'delivery_address' => $user->delivery_address,
            'has_linked_account' => true, // P16: Always true now
            // P16: Always include customer data
            'customer' => $customer ? [
                'id' => $customer->id,
                'customer_code' => $customer->customer_code,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'loyalty_points' => $customer->points_balance ?? 0,
                'customer_tier' => $customer->customer_tier ?? 'bronze',
                'total_spent' => (float) ($customer->total_spent ?? 0),
                'visit_count' => $customer->visit_count ?? 0,
            ] : null,
        ];

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }


    /**
     * Link account by phone number
     */
    public function linkByPhone(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => 'required|string',
        ]);

        $phone = ltrim($validated['phone'], '+');

        // Find customer by phone
        $customer = \App\Models\Customer::whereHas('user', function ($q) use ($phone) {
            $q->where('phone', 'like', '%' . $phone);
        })->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'error' => 'No account found with this phone number',
            ], 404);
        }

        // Update Telegram user
        $telegramUser = $request->user('telegram');
        $telegramUser->update(['customer_id' => $customer->id]);

        return response()->json([
            'success' => true,
            'message' => 'Account linked successfully',
            'data' => [
                'customer_id' => $customer->id,
                'customer_code' => $customer->customer_code,
                'loyalty_points' => $customer->points_balance ?? 0,
            ],
        ]);
    }

    /**
     * Link account by email
     */
    public function linkByEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        // Find customer by email
        $customer = \App\Models\Customer::whereHas('user', function ($q) use ($validated) {
            $q->where('email', $validated['email']);
        })->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'error' => 'No account found with this email',
            ], 404);
        }

        // Update Telegram user
        $telegramUser = $request->user('telegram');
        $telegramUser->update(['customer_id' => $customer->id]);

        return response()->json([
            'success' => true,
            'message' => 'Account linked successfully',
            'data' => [
                'customer_id' => $customer->id,
                'customer_code' => $customer->customer_code,
                'loyalty_points' => $customer->points_balance ?? 0,
            ],
        ]);
    }

    /**
     * Get addresses (works for both guest and linked accounts)
     * All addresses stored in customer_addresses table
     * - Guest users: linked by telegram_user_id
     * - Linked users: linked by customer_id
     */
    public function addresses(Request $request): JsonResponse
    {
        $user = $request->user('telegram');

        // Query addresses - allow accessing both linked and direct telegram addresses
        $query = CustomerAddress::query()
            ->where(function ($q) use ($user) {
                $q->where('telegram_user_id', $user->id);
                if ($user->customer_id) {
                    $q->orWhere('customer_id', $user->customer_id);
                }
            });

        $addresses = $query->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get()
            // Map logic remains same...
            ->map(function ($addr) use ($user) {
                return [
                    'id' => $addr->id,
                    'label' => $addr->label,
                    'address_line_1' => $addr->address_line_1,
                    'address_line_2' => $addr->address_line_2,
                    'city' => $addr->city,
                    'province' => $addr->province,
                    'postal_code' => $addr->postal_code,
                    'latitude' => $addr->latitude,
                    'longitude' => $addr->longitude,
                    'delivery_instructions' => $addr->delivery_instructions,
                    'is_default' => (bool) $addr->is_default,
                    'source' => $addr->customer_id ? 'customer' : 'telegram',
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $addresses,
        ]);
    }

    // ... updateProfile ...

    // addAddress already fixed to use customer_id if available.

    /**
     * Add a new address (stored in database for both guest and linked accounts)
     */
    public function addAddress(Request $request): JsonResponse
    {
        \Log::info('📍 Telegram addAddress request', $request->all());

        try {
            $validated = $request->validate([
                'label' => 'required|string|max:50',
                'address_line_1' => 'required|string|max:255',
                'address_line_2' => 'nullable|string|max:255',
                'city' => 'required|string|max:100',
                'province' => 'nullable|string|max:100',
                'postal_code' => 'nullable|string|max:20',
                'latitude' => 'nullable|numeric',
                'longitude' => 'nullable|numeric',
                'delivery_instructions' => 'nullable|string|max:500',
                'is_default' => 'nullable|boolean',
            ]);

            $user = $request->user('telegram');

            // P16: Ensure customer exists (backfill if missing) - SAFE VERSION
            if (!$user->customer_id) {
                try {
                    $customer = \App\Models\Customer::create([
                        'user_id' => null,
                        'name' => $user->display_name ?: 'Telegram User',
                        'phone' => $user->phone_number,
                        'customer_code' => \App\Models\Customer::generateCustomerCode('TG'),
                        'customer_tier' => 'bronze',
                    ]);
                    $user->update(['customer_id' => $customer->id]);
                    \Log::info('✅ Auto-created Customer in addAddress', ['customer_id' => $customer->id]);
                } catch (\Exception $e) {
                    \Log::error('❌ Failed to auto-create customer in addAddress: ' . $e->getMessage());
                    // Continue without customer_id
                }
            }
            
            // Link to customer_id if available, otherwise telegram_user_id
            $ownerField = $user->customer_id ? 'customer_id' : 'telegram_user_id';
            $ownerId = $user->customer_id ? $user->customer_id : $user->id;

            // If setting as default, unset other defaults first
            if ($validated['is_default'] ?? false) {
                \App\Models\CustomerAddress::where($ownerField, $ownerId)
                    ->update(['is_default' => false]);
            }

            // Create address in database
            $address = \App\Models\CustomerAddress::create([
                $ownerField => $ownerId,
                'label' => $validated['label'],
                'address_line_1' => $validated['address_line_1'],
                'address_line_2' => $validated['address_line_2'] ?? null,
                'city' => $validated['city'],
                'province' => $validated['province'] ?? $validated['city'],
                'postal_code' => $validated['postal_code'] ?? '',
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
                'delivery_instructions' => $validated['delivery_instructions'] ?? null,
                'is_default' => $validated['is_default'] ?? false,
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Address added successfully',
                'data' => [
                    'id' => $address->id,
                    'label' => $address->label,
                    'address_line_1' => $address->address_line_1,
                    'address_line_2' => $address->address_line_2,
                    'city' => $address->city,
                    'province' => $address->province,
                    'postal_code' => $address->postal_code,
                    'latitude' => $address->latitude,
                    'longitude' => $address->longitude,
                    'delivery_instructions' => $address->delivery_instructions,
                    'is_default' => (bool) $address->is_default,
                    'source' => $user->customer_id ? 'customer' : 'telegram',
                ],
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::warning('⚠️ Validation failed in addAddress', $e->errors());
            throw $e;
        } catch (\Exception $e) {
            \Log::error('❌ Error in addAddress: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Server error'], 500);
        }
    }

    /**
     * Update an existing address
     */
    public function updateAddress(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'label' => 'nullable|string|max:50',
            'address_line_1' => 'nullable|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'delivery_instructions' => 'nullable|string|max:500',
            'is_default' => 'nullable|boolean',
        ]);

        $user = $request->user('telegram');

        // Find address by either ID
        $address = CustomerAddress::where('id', $id)
            ->where(function ($q) use ($user) {
                $q->where('telegram_user_id', $user->id);
                if ($user->customer_id) {
                    $q->orWhere('customer_id', $user->customer_id);
                }
            })
            ->first();

        if (!$address) {
            return response()->json([
                'success' => false,
                'error' => 'Address not found',
            ], 404);
        }

        // If setting as default, unset other defaults first
        if ($validated['is_default'] ?? false) {
             CustomerAddress::where(function ($q) use ($user) {
                    $q->where('telegram_user_id', $user->id);
                    if ($user->customer_id) {
                        $q->orWhere('customer_id', $user->customer_id);
                    }
                })
                ->where('id', '!=', $id)
                ->update(['is_default' => false]);
        }

        // Ensure we migrate ownership to customer_id on update if available
        $updates = array_filter($validated, fn($v) => $v !== null);
        if ($user->customer_id && !$address->customer_id) {
            $updates['customer_id'] = $user->customer_id;
        }

        $address->update($updates);

        return response()->json([
            'success' => true,
            'message' => 'Address updated successfully',
            'data' => [
                'id' => $address->id,
                'label' => $address->label,
                'address_line_1' => $address->address_line_1,
                'address_line_2' => $address->address_line_2,
                'city' => $address->city,
                'province' => $address->province,
                'postal_code' => $address->postal_code,
                'latitude' => $address->latitude,
                'longitude' => $address->longitude,
                'delivery_instructions' => $address->delivery_instructions,
                'is_default' => (bool) $address->is_default,
                'source' => $address->customer_id ? 'customer' : 'telegram',
            ],
        ]);
    }

    /**
     * Delete an address
     */
    public function deleteAddress(Request $request, $id): JsonResponse
    {
        $user = $request->user('telegram');

        $address = CustomerAddress::where('id', $id)
            ->where(function ($q) use ($user) {
                $q->where('telegram_user_id', $user->id);
                if ($user->customer_id) {
                    $q->orWhere('customer_id', $user->customer_id);
                }
            })
            ->first();

        if (!$address) {
            return response()->json([
                'success' => false,
                'error' => 'Address not found',
            ], 404);
        }

        $address->delete();

        return response()->json([
            'success' => true,
            'message' => 'Address deleted successfully',
        ]);
    }

    /**
     * Set an address as default
     */
    public function setDefaultAddress(Request $request, $id): JsonResponse
    {
        $user = $request->user('telegram');

        $address = CustomerAddress::where('id', $id)
            ->where(function ($q) use ($user) {
                $q->where('telegram_user_id', $user->id);
                if ($user->customer_id) {
                    $q->orWhere('customer_id', $user->customer_id);
                }
            })
            ->first();

        if (!$address) {
            return response()->json([
                'success' => false,
                'error' => 'Address not found',
            ], 404);
        }

        // Unset all defaults
        CustomerAddress::where(function ($q) use ($user) {
                $q->where('telegram_user_id', $user->id);
                if ($user->customer_id) {
                    $q->orWhere('customer_id', $user->customer_id);
                }
            })
            ->update(['is_default' => false]);

        // Migrate ownership if needed
        $updates = ['is_default' => true];
        if ($user->customer_id && !$address->customer_id) {
            $updates['customer_id'] = $user->customer_id;
        }

        $address->update($updates);

        // Also update TelegramUser's delivery_address for convenience
        $user->update([
            'delivery_address' => $address->address_line_1 . 
                ($address->address_line_2 ? ', ' . $address->address_line_2 : '') .
                ', ' . $address->city,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Default address updated',
        ]);
    }

    /**
     * Get loyalty stats
     */
    public function loyaltyStats(Request $request): JsonResponse
    {
        $user = $request->user('telegram');

        if (!$user->hasLinkedAccount()) {
            return response()->json([
                'success' => false,
                'error' => 'Account not linked',
            ], 401);
        }

        $customer = $user->customer;

        return response()->json([
            'success' => true,
            'data' => [
                'points_balance' => $customer->points_balance ?? 0,
                'customer_tier' => $customer->customer_tier ?? 'Bronze',
                'total_spent' => (float) ($customer->total_spent ?? 0),
                'visit_count' => $customer->visit_count ?? 0,
                'member_since' => $customer->created_at?->toISOString(),
            ],
        ]);
    }

    /**
     * Get notification preferences
     */
    public function notificationPreferences(Request $request): JsonResponse
    {
        $user = $request->user('telegram');

        return response()->json([
            'success' => true,
            'data' => [
                'notifications_enabled' => $user->notifications_enabled,
                'order_updates' => true,
                'promotions' => true,
            ],
        ]);
    }

    /**
     * Update notification preferences
     */
    public function updateNotificationPreferences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'notifications_enabled' => 'nullable|boolean',
            'order_updates' => 'nullable|boolean',
            'promotions' => 'nullable|boolean',
        ]);

        $user = $request->user('telegram');

        if (isset($validated['notifications_enabled'])) {
            $user->update(['notifications_enabled' => $validated['notifications_enabled']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Preferences updated',
        ]);
    }
}

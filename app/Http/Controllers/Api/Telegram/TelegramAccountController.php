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

        // Query addresses - for linked accounts use customer_id, for guests use telegram_user_id
        $query = CustomerAddress::query();
        
        if ($user->hasLinkedAccount()) {
            $query->where('customer_id', $user->customer_id);
        } else {
            $query->where('telegram_user_id', $user->id);
        }

        $addresses = $query->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get()
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
                    'source' => $user->hasLinkedAccount() ? 'customer' : 'telegram',
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $addresses,
        ]);
    }

    /**
     * Update profile information
     * 
     * SPRINT P16: Now syncs to Customer record as well as TelegramUser
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'nullable|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'phone_number' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'delivery_address' => 'nullable|string|max:500',
        ]);

        $user = $request->user('telegram');

        // Update TelegramUser
        $telegramUpdates = array_filter([
            'first_name' => $validated['first_name'] ?? null,
            'last_name' => $validated['last_name'] ?? null,
            'phone_number' => $validated['phone_number'] ?? null,
            'delivery_address' => $validated['delivery_address'] ?? null,
        ], fn($value) => $value !== null);

        if (!empty($telegramUpdates)) {
            $user->update($telegramUpdates);
        }

        // P16: Sync to Customer record
        if ($user->customer_id) {
            $customer = $user->customer;
            $customerUpdates = [];

            // Update name if first/last name changed
            if (isset($validated['first_name']) || isset($validated['last_name'])) {
                $firstName = $validated['first_name'] ?? $user->first_name ?? '';
                $lastName = $validated['last_name'] ?? $user->last_name ?? '';
                $customerUpdates['name'] = trim("{$firstName} {$lastName}") ?: 'Telegram User';
            }

            if (isset($validated['phone_number'])) {
                $customerUpdates['phone'] = $validated['phone_number'];
            }

            if (isset($validated['email'])) {
                $customerUpdates['email'] = $validated['email'];
            }

            if (!empty($customerUpdates)) {
                $customer->update($customerUpdates);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => [
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'phone_number' => $user->phone_number,
                'email' => $user->customer?->email,
                'delivery_address' => $user->delivery_address,
                'display_name' => $user->display_name,
            ],
        ]);
    }


    /**
     * Add a new address (stored in database for both guest and linked accounts)
     */
    public function addAddress(Request $request): JsonResponse
    {
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

        // Determine ownership - customer_id for linked, telegram_user_id for guests
        $ownerField = $user->hasLinkedAccount() ? 'customer_id' : 'telegram_user_id';
        $ownerId = $user->hasLinkedAccount() ? $user->customer_id : $user->id;

        // If setting as default, unset other defaults first
        if ($validated['is_default'] ?? false) {
            CustomerAddress::where($ownerField, $ownerId)
                ->update(['is_default' => false]);
        }

        // Create address in database
        $address = CustomerAddress::create([
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
                'source' => $user->hasLinkedAccount() ? 'customer' : 'telegram',
            ],
        ]);
    }

    /**
     * Update an existing address (stored in database for both guest and linked accounts)
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

        // Determine ownership
        $ownerField = $user->hasLinkedAccount() ? 'customer_id' : 'telegram_user_id';
        $ownerId = $user->hasLinkedAccount() ? $user->customer_id : $user->id;

        // Find address
        $address = CustomerAddress::where($ownerField, $ownerId)
            ->where('id', $id)
            ->first();

        if (!$address) {
            return response()->json([
                'success' => false,
                'error' => 'Address not found',
            ], 404);
        }

        // If setting as default, unset other defaults first
        if ($validated['is_default'] ?? false) {
            CustomerAddress::where($ownerField, $ownerId)
                ->where('id', '!=', $id)
                ->update(['is_default' => false]);
        }

        $address->update(array_filter($validated, fn($v) => $v !== null));

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
                'source' => $user->hasLinkedAccount() ? 'customer' : 'telegram',
            ],
        ]);
    }

    /**
     * Delete an address (from database for both guest and linked accounts)
     */
    public function deleteAddress(Request $request, $id): JsonResponse
    {
        $user = $request->user('telegram');

        // Determine ownership
        $ownerField = $user->hasLinkedAccount() ? 'customer_id' : 'telegram_user_id';
        $ownerId = $user->hasLinkedAccount() ? $user->customer_id : $user->id;

        // Find address
        $address = CustomerAddress::where($ownerField, $ownerId)
            ->where('id', $id)
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
     * Set an address as default (in database for both guest and linked accounts)
     */
    public function setDefaultAddress(Request $request, $id): JsonResponse
    {
        $user = $request->user('telegram');

        // Determine ownership
        $ownerField = $user->hasLinkedAccount() ? 'customer_id' : 'telegram_user_id';
        $ownerId = $user->hasLinkedAccount() ? $user->customer_id : $user->id;

        // Find address
        $address = CustomerAddress::where($ownerField, $ownerId)
            ->where('id', $id)
            ->first();

        if (!$address) {
            return response()->json([
                'success' => false,
                'error' => 'Address not found',
            ], 404);
        }

        // Unset all defaults first
        CustomerAddress::where($ownerField, $ownerId)
            ->update(['is_default' => false]);

        $address->update(['is_default' => true]);

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

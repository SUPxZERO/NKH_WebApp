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

        $data = [
            'id' => $user->id,
            'telegram_id' => $user->telegram_id,
            'telegram_username' => $user->telegram_username,
            'display_name' => $user->display_name,
            'has_linked_account' => $user->hasLinkedAccount(),
        ];

        if ($user->hasLinkedAccount()) {
            $customer = $user->customer;
            $data['customer'] = [
                'id' => $customer->id,
                'customer_code' => $customer->customer_code,
                'loyalty_points' => $customer->points_balance ?? 0,
                'customer_tier' => $customer->customer_tier ?? 'Bronze',
            ];
        }

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
     * Get customer addresses
     */
    public function addresses(Request $request): JsonResponse
    {
        $user = $request->user('telegram');

        if (!$user->hasLinkedAccount()) {
            return response()->json([
                'success' => false,
                'error' => 'Account not linked',
            ], 401);
        }

        $addresses = CustomerAddress::where('customer_id', $user->customer_id)
            ->get()
            ->map(function ($addr) {
                return [
                    'id' => $addr->id,
                    'label' => $addr->label,
                    'address_line_1' => $addr->address_line_1,
                    'address_line_2' => $addr->address_line_2,
                    'city' => $addr->city,
                    'is_default' => $addr->is_default,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $addresses,
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

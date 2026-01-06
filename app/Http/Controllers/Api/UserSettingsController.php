<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\TelegramAwareAuth;
use App\Models\UserSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserSettingsController extends Controller
{
    use TelegramAwareAuth;

    /**
     * Get user/customer ID for settings storage
     * Uses User ID for standard auth, or pseudo-ID for Telegram guests
     */
    private function getSettingsOwnerId(Request $request): ?int
    {
        if ($request->user()) {
            return $request->user()->id;
        }
        
        // For Telegram guests, use same pseudo-ID approach as NotificationPreferences
        $customer = $this->getCurrentCustomer($request);
        if ($customer) {
            return 900000000 + $customer->id;
        }
        
        return null;
    }

    /**
     * Get the current user's settings.
     */
    public function show(Request $request): JsonResponse
    {
        $ownerId = $this->getSettingsOwnerId($request);
        
        if (!$ownerId) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required',
            ], 401);
        }
        
        // Get or create settings for user
        $settings = UserSetting::firstOrCreate(
            ['user_id' => $ownerId],
            UserSetting::getDefaults()
        );

        return response()->json([
            'success' => true,
            'data' => $settings->toFrontendFormat(),
        ]);
    }

    /**
     * Update the current user's settings.
     */
    public function update(Request $request): JsonResponse
    {
        $ownerId = $this->getSettingsOwnerId($request);
        
        if (!$ownerId) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required',
            ], 401);
        }
        
        // Validate request
        $validated = $request->validate([
            'notifications' => 'sometimes|array',
            'notifications.orderUpdates' => 'sometimes|boolean',
            'notifications.promotions' => 'sometimes|boolean',
            'notifications.newsletter' => 'sometimes|boolean',
            'notifications.smsNotifications' => 'sometimes|boolean',
            'notifications.pushNotifications' => 'sometimes|boolean',
            'privacy' => 'sometimes|array',
            'privacy.showProfile' => 'sometimes|boolean',
            'privacy.shareOrderHistory' => 'sometimes|boolean',
            'privacy.allowAnalytics' => 'sometimes|boolean',
            'theme' => 'sometimes|in:light,dark,system',
            'language' => 'sometimes|string|max:10',
        ]);

        // Get or create settings
        $settings = UserSetting::firstOrCreate(
            ['user_id' => $ownerId],
            UserSetting::getDefaults()
        );

        // Update from frontend format
        $settings->updateFromFrontend($validated);

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully',
            'data' => $settings->toFrontendFormat(),
        ]);
    }

    /**
     * Update notifications settings.
     */
    public function updateNotifications(Request $request): JsonResponse
    {
        return $this->updateCategory($request, 'notifications');
    }

    /**
     * Update privacy settings.
     */
    public function updatePrivacy(Request $request): JsonResponse
    {
        return $this->updateCategory($request, 'privacy');
    }

    /**
     * Update theme setting.
     */
    public function updateTheme(Request $request): JsonResponse
    {
        return $this->updateCategory($request, 'theme');
    }

    /**
     * Update language setting.
     */
    public function updateLanguage(Request $request): JsonResponse
    {
        return $this->updateCategory($request, 'language');
    }

    /**
     * Update a specific setting category.
     */
    public function updateCategory(Request $request, string $category): JsonResponse
    {
        $ownerId = $this->getSettingsOwnerId($request);
        
        if (!$ownerId) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required',
            ], 401);
        }
        
        // Get or create settings
        $settings = UserSetting::firstOrCreate(
            ['user_id' => $ownerId],
            UserSetting::getDefaults()
        );

        switch ($category) {
            case 'notifications':
                $validated = $request->validate([
                    'orderUpdates' => 'sometimes|boolean',
                    'promotions' => 'sometimes|boolean',
                    'newsletter' => 'sometimes|boolean',
                    'smsNotifications' => 'sometimes|boolean',
                    'pushNotifications' => 'sometimes|boolean',
                ]);
                $settings->updateFromFrontend(['notifications' => $validated]);
                break;

            case 'privacy':
                $validated = $request->validate([
                    'showProfile' => 'sometimes|boolean',
                    'shareOrderHistory' => 'sometimes|boolean',
                    'allowAnalytics' => 'sometimes|boolean',
                ]);
                $settings->updateFromFrontend(['privacy' => $validated]);
                break;

            case 'theme':
                $validated = $request->validate([
                    'theme' => 'required|in:light,dark,system',
                ]);
                $settings->theme = $validated['theme'];
                $settings->save();
                break;

            case 'language':
                $validated = $request->validate([
                    'language' => 'required|string|max:10',
                ]);
                $settings->language = $validated['language'];
                $settings->save();
                break;

            default:
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid category',
                ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => ucfirst($category) . ' settings updated successfully',
            'data' => $settings->toFrontendFormat(),
        ]);
    }

    /**
     * Change user password.
     */
    public function changePassword(Request $request): JsonResponse
    {
        // Telegram guests cannot change password (no User record)
        if (!$request->user() && $this->isTelegramGuest($request)) {
            return response()->json([
                'success' => false,
                'message' => 'Password change is not available for Telegram guests',
                'info' => 'Create a full account to set a password.'
            ], 422);
        }

        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required',
            ], 401);
        }

        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => ['required', 'string', 'confirmed', Password::min(8)],
        ]);

        // Check current password
        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect',
                'errors' => [
                    'current_password' => ['The current password is incorrect.'],
                ],
            ], 422);
        }

        // Update password
        $user->password = Hash::make($validated['new_password']);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully',
        ]);
    }

    /**
     * Update user phone number.
     */
    public function updatePhone(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => 'required|string|max:20',
        ]);

        // Standard user
        if ($request->user()) {
            $user = $request->user();
            $user->phone = $validated['phone'];
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Phone number updated successfully',
                'data' => [
                    'phone' => $user->phone,
                ],
            ]);
        }

        // Telegram guest - update customer record
        if ($this->isTelegramGuest($request)) {
            $customer = $this->getCurrentCustomer($request);
            if ($customer) {
                $customer->phone = $validated['phone'];
                $customer->save();

                // Also update TelegramUser if available
                $telegramUser = $this->getTelegramUser($request);
                if ($telegramUser) {
                    $telegramUser->phone_number = $validated['phone'];
                    $telegramUser->save();
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Phone number updated successfully',
                    'data' => [
                        'phone' => $customer->phone,
                    ],
                ]);
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'Authentication required',
        ], 401);
    }
}

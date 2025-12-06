<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserSettingsController extends Controller
{
    /**
     * Get the current user's settings.
     */
    public function show(): JsonResponse
    {
        $user = Auth::user();
        
        // Get or create settings for user
        $settings = UserSetting::firstOrCreate(
            ['user_id' => $user->id],
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
        $user = Auth::user();
        
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
            ['user_id' => $user->id],
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
     * Update a specific setting category.
     */
    public function updateCategory(Request $request, string $category): JsonResponse
    {
        $user = Auth::user();
        
        // Get or create settings
        $settings = UserSetting::firstOrCreate(
            ['user_id' => $user->id],
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
        $user = Auth::user();

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
        $user = Auth::user();

        $validated = $request->validate([
            'phone' => 'required|string|max:20',
        ]);

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
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\TelegramAwareAuth;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class UserProfileController extends Controller
{
    use TelegramAwareAuth;

    /**
     * Update the authenticated user's profile
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        // For Telegram guests without User record, delegate to customer/telegram update
        if (!$user && $this->isTelegramGuest($request)) {
            return $this->updateTelegramGuestProfile($request);
        }

        if (!$user) {
            return response()->json(['message' => __('messages.api.errors.unauthenticated')], 401);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20|unique:users,phone,' . $user->id,
            'address' => 'nullable|string|max:500',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => __('messages.api.success.profile_updated'),
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
                'latitude' => $user->latitude,
                'longitude' => $user->longitude,
                'avatar' => $user->avatar_url,
                'image_path' => $user->image_path_url,
            ]
        ]);
    }

    /**
     * Update profile for Telegram guests (no User record)
     */
    private function updateTelegramGuestProfile(Request $request): JsonResponse
    {
        $customer = $this->getCurrentCustomer($request);
        $telegramUser = $this->getTelegramUser($request);

        if (!$customer && !$telegramUser) {
            return response()->json(['message' => __('messages.api.errors.profile_not_found')], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        // Update TelegramUser if available
        if ($telegramUser && isset($validated['name'])) {
            $names = explode(' ', $validated['name'], 2);
            $telegramUser->first_name = $names[0];
            if (isset($names[1])) {
                $telegramUser->last_name = $names[1];
            }
            if (isset($validated['phone'])) {
                $telegramUser->phone_number = $validated['phone'];
            }
            $telegramUser->save();
        }

        // Update Customer if available
        if ($customer) {
            $customerUpdate = [];
            if (isset($validated['name']))
                $customerUpdate['name'] = $validated['name'];
            if (isset($validated['email']))
                $customerUpdate['email'] = $validated['email'];
            if (isset($validated['phone']))
                $customerUpdate['phone'] = $validated['phone'];

            if (!empty($customerUpdate)) {
                $customer->update($customerUpdate);
            }
        }

        return response()->json([
            'message' => __('messages.api.success.profile_updated'),
            'data' => [
                'id' => $customer?->id ?? 0,
                'name' => $customer?->name ?? $telegramUser?->display_name,
                'email' => $customer?->email,
                'phone' => $customer?->phone ?? $telegramUser?->phone_number,
                'is_telegram_guest' => true,
            ]
        ]);
    }

    /**
     * Upload and update user profile Image
     * 
     * Supports:
     * 1. Standard authenticated users (stores on User model)
     * 2. Telegram users with linked User account (stores on User model)
     * 3. Telegram users without User account (stores on Customer model)
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        // Get user - either from direct auth or via Telegram customer linkage
        $user = $request->user();
        $customer = null;
        $telegramUser = null;

        // If no direct user, try to get via Telegram session
        if (!$user && $this->isTelegramGuest($request)) {
            // Using logic from trait manually to avoid "undefined method" risk if trait isn't updating
            $customer = $this->getCurrentCustomer($request);
            // $telegramUser = $this->getTelegramUser($request); // Not needed for avatar

            // Check if customer has a linked User account
            if ($customer && $customer->user) {
                $user = $customer->user;
            }
        }

        // Check if file was received at all
        if (!$request->hasFile('avatar')) {
            return response()->json([
                'message' => __('messages.api.validation.upload.no_file'),
                'errors' => ['avatar' => [__('messages.api.validation.upload.no_file')]],
            ], 422);
        }

        $file = $request->file('avatar');

        // Check for upload errors
        if (!$file->isValid()) {
            return response()->json([
                'message' => __('messages.api.validation.upload.failed_prefix') . $file->getErrorMessage(),
                'errors' => ['avatar' => [__('messages.api.validation.upload.failed_prefix') . $file->getErrorMessage()]],
            ], 422);
        }

        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048', // Max 2MB
        ]);

        // Must have either User or Customer to store avatar
        if (!$user && !$customer) {
            return response()->json([
                'message' => __('messages.api.errors.authentication_required'),
                'errors' => ['auth' => [__('messages.api.validation.upload.auth_required')]],
            ], 401);
        }

        // Store new image
        $path = $file->store('avatars', 'public');

        // If we have a User, store on User model
        if ($user) {
            // Delete old images if exists
            if ($user->image_path) {
                Storage::disk('public')->delete($user->image_path);
            }
            if ($user->avatar && $user->avatar !== $user->image_path) {
                Storage::disk('public')->delete($user->avatar);
            }

            // Update user record
            $user->update([
                'image_path' => $path,
                'avatar' => $path,
            ]);
        }
        // If Telegram user without User account, store on Customer model
        elseif ($customer) {
            // Delete old avatar if exists
            if ($customer->avatar) {
                Storage::disk('public')->delete($customer->avatar);
            }

            // Update customer record
            $customer->update([
                'avatar' => $path,
            ]);
        }

        return response()->json([
            'message' => __('messages.api.success.avatar_updated'),
            'avatar_url' => Storage::url($path),
            'image_path' => $path,
            'image_path_url' => Storage::url($path),
        ]);
    }

    /**
     * Change the authenticated user's password
     */
    public function changePassword(Request $request): JsonResponse
    {
        // Telegram guests cannot change password (no User record)
        if (!$request->user() && $this->isTelegramGuest($request)) {
            return response()->json([
                'message' => __('messages.api.validation.password.telegram_guest'),
                'info' => __('messages.api.validation.password.create_account_hint')
            ], 422);
        }

        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => __('messages.api.errors.unauthenticated')], 401);
        }

        // Verify current password
        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => __('messages.api.validation.password.incorrect')
            ], 422);
        }

        // Update password
        $user->update([
            'password' => Hash::make($validated['new_password'])
        ]);

        return response()->json([
            'message' => __('messages.api.success.password_changed')
        ]);
    }

    /**
     * Delete the authenticated user's avatar
     * 
     * Supports both User model (standard auth) and Customer model (Telegram)
     */
    public function deleteAvatar(Request $request): JsonResponse
    {
        $user = $request->user();
        $customer = null;

        // If no direct user, try to get via Telegram session
        if (!$user && $this->isTelegramGuest($request)) {
            $customer = $this->getCurrentCustomer($request);
            // Check if customer has a linked User account
            if ($customer && $customer->user) {
                $user = $customer->user;
            }
        }

        // Must have either User or Customer to delete avatar
        if (!$user && !$customer) {
            return response()->json(['message' => __('messages.api.errors.unauthenticated')], 401);
        }

        // If we have a User, delete from User model
        if ($user) {
            // Delete from storage
            if ($user->image_path) {
                Storage::disk('public')->delete($user->image_path);
            }
            if ($user->avatar && $user->avatar !== $user->image_path) {
                Storage::disk('public')->delete($user->avatar);
            }

            // Clear both fields
            $user->update([
                'image_path' => null,
                'avatar' => null,
            ]);
        }
        // If Telegram user without User account, delete from Customer model
        elseif ($customer && $customer->avatar) {
            // Delete from storage
            Storage::disk('public')->delete($customer->avatar);

            // Clear avatar field
            $customer->update([
                'avatar' => null,
            ]);
        }

        return response()->json([
            'message' => __('messages.api.success.avatar_deleted')
        ]);
    }

    /**
     * Get full avatar URL for the authenticated user
     * 
     * Supports both User model (standard auth) and Customer model (Telegram)
     */
    public function getAvatarUrl(Request $request): JsonResponse
    {
        $user = $request->user();
        $customer = null;

        // For Telegram guests, check Customer avatar
        if (!$user && $this->isTelegramGuest($request)) {
            $customer = $this->getCurrentCustomer($request);
            // Check if customer has a linked User account
            if ($customer && $customer->user) {
                $user = $customer->user;
            }
        }

        // Return User avatar if available
        if ($user) {
            return response()->json([
                'avatar_url' => $user->avatar_url,
                'image_path' => $user->image_path,
                'image_path_url' => $user->image_path_url,
                'has_avatar' => !empty($user->image_path) || !empty($user->avatar),
            ]);
        }

        // Return Customer avatar if available (Telegram users)
        if ($customer) {
            $avatarUrl = $customer->avatar ? Storage::url($customer->avatar) : null;
            return response()->json([
                'avatar_url' => $avatarUrl,
                'image_path' => $customer->avatar,
                'image_path_url' => $avatarUrl,
                'has_avatar' => !empty($customer->avatar),
                'is_telegram_guest' => true,
            ]);
        }

        return response()->json(['message' => __('messages.api.errors.unauthenticated')], 401);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class UserProfileController extends Controller
{
    /**
     * Update the authenticated user's profile
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully',
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
     * Upload and update user profile image
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        // Check if file was received at all
        if (!$request->hasFile('avatar')) {
            return response()->json([
                'message' => 'No file received',
                'errors' => ['avatar' => ['No file was uploaded. Please try again.']],
                'debug' => [
                    'files' => $request->allFiles(),
                    'all_input' => array_keys($request->all()),
                ]
            ], 422);
        }

        $file = $request->file('avatar');
        
        // Check for upload errors
        if (!$file->isValid()) {
            return response()->json([
                'message' => 'File upload failed',
                'errors' => ['avatar' => ['File upload error: ' . $file->getErrorMessage()]],
            ], 422);
        }

        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048', // Max 2MB
        ]);

        $user = $request->user();

        // Defensive check - this shouldn't happen if auth middleware is applied
        if (!$user) {
            return response()->json([
                'message' => 'Authentication required',
                'errors' => ['auth' => ['You must be logged in to upload a profile picture.']],
            ], 401);
        }

        // Delete old image if exists
        if ($user->image_path) {
            Storage::disk('public')->delete($user->image_path);
        }
        if ($user->avatar && $user->avatar !== $user->image_path) {
            Storage::disk('public')->delete($user->avatar);
        }

        // Store new image
        $path = $file->store('avatars', 'public');

        // Update user record - set both fields for compatibility
        $user->update([
            'image_path' => $path,
            'avatar' => $path,
        ]);

        return response()->json([
            'message' => 'Profile picture updated successfully',
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
        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        // Verify current password
        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect'
            ], 422);
        }

        // Update password
        $user->update([
            'password' => Hash::make($validated['new_password'])
        ]);

        return response()->json([
            'message' => 'Password changed successfully'
        ]);
    }

    /**
     * Delete the authenticated user's avatar
     */
    public function deleteAvatar(Request $request): JsonResponse
    {
        $user = $request->user();

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

        return response()->json([
            'message' => 'Profile picture deleted successfully'
        ]);
    }

    /**
     * Get full avatar URL for the authenticated user
     */
    public function getAvatarUrl(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'avatar_url' => $user->avatar_url,
            'image_path' => $user->image_path,
            'image_path_url' => $user->image_path_url,
            'has_avatar' => !empty($user->image_path) || !empty($user->avatar),
        ]);
    }
}

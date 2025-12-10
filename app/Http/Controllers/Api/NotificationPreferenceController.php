<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NotificationPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationPreferenceController extends Controller
{
    /**
     * Get all notification preferences for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $preferences = NotificationPreference::getForUser($user->id);

        return response()->json([
            'success' => true,
            'data' => [
                'preferences' => $preferences,
                'channels' => NotificationPreference::CHANNELS,
                'types' => NotificationPreference::TYPES,
            ],
        ]);
    }

    /**
     * Update notification preferences for the authenticated user
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'preferences' => 'required|array',
            'preferences.*' => 'array',
            'preferences.*.*' => 'boolean',
        ]);

        NotificationPreference::updateBulk($user->id, $validated['preferences']);

        return response()->json([
            'success' => true,
            'message' => 'Notification preferences updated successfully',
            'data' => [
                'preferences' => NotificationPreference::getForUser($user->id),
            ],
        ]);
    }

    /**
     * Toggle a specific notification preference
     */
    public function toggle(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'channel' => 'required|string|in:' . implode(',', array_keys(NotificationPreference::CHANNELS)),
            'type' => 'required|string|in:' . implode(',', array_keys(NotificationPreference::TYPES)),
            'enabled' => 'required|boolean',
        ]);

        $pref = NotificationPreference::setPreference(
            $user->id,
            $validated['type'],
            $validated['channel'],
            $validated['enabled']
        );

        return response()->json([
            'success' => true,
            'message' => $validated['enabled'] 
                ? "Enabled {$validated['type']} notifications via {$validated['channel']}" 
                : "Disabled {$validated['type']} notifications via {$validated['channel']}",
            'data' => $pref,
        ]);
    }

    /**
     * Disable all notifications (quick toggle)
     */
    public function disableAll(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Disable all notification types for all channels
        $preferences = [];
        foreach (NotificationPreference::CHANNELS as $channel => $label) {
            foreach (NotificationPreference::TYPES as $type => $typeLabel) {
                $preferences[$channel][$type] = false;
            }
        }

        NotificationPreference::updateBulk($user->id, $preferences);

        return response()->json([
            'success' => true,
            'message' => 'All notifications disabled',
        ]);
    }

    /**
     * Enable all notifications (quick toggle)
     */
    public function enableAll(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Enable all notification types for all channels
        $preferences = [];
        foreach (NotificationPreference::CHANNELS as $channel => $label) {
            foreach (NotificationPreference::TYPES as $type => $typeLabel) {
                $preferences[$channel][$type] = true;
            }
        }

        NotificationPreference::updateBulk($user->id, $preferences);

        return response()->json([
            'success' => true,
            'message' => 'All notifications enabled',
        ]);
    }
}

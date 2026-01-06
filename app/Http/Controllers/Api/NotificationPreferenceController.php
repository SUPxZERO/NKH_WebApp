<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\TelegramAwareAuth;
use App\Models\NotificationPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationPreferenceController extends Controller
{
    use TelegramAwareAuth;

    /**
     * Get identifier for notification preferences.
     * Uses user_id if available, falls back to customer_id prefixed with 'c_' for Telegram guests.
     */
    private function getPreferenceOwnerId(Request $request): ?int
    {
        // Standard auth - use user ID
        if ($request->user()) {
            return $request->user()->id;
        }

        // Telegram guest - use their linked user_id if customer has one
        $customer = $this->getCurrentCustomer($request);
        if ($customer && $customer->user_id) {
            return $customer->user_id;
        }

        // Pure Telegram guest without linked user - use customer_id with offset
        // This allows Telegram guests to have preferences stored with a pseudo user_id
        if ($customer) {
            // Use a high offset to avoid collision with real user IDs
            // e.g., customer_id 1 becomes 900000001
            return 900000000 + $customer->id;
        }

        return null;
    }

    /**
     * Get all notification preferences for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $ownerId = $this->getPreferenceOwnerId($request);
        
        if (!$ownerId) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $preferences = NotificationPreference::getForUser($ownerId);

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
        $ownerId = $this->getPreferenceOwnerId($request);
        
        if (!$ownerId) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'preferences' => 'required|array',
            'preferences.*' => 'array',
            'preferences.*.*' => 'boolean',
        ]);

        NotificationPreference::updateBulk($ownerId, $validated['preferences']);

        return response()->json([
            'success' => true,
            'message' => 'Notification preferences updated successfully',
            'data' => [
                'preferences' => NotificationPreference::getForUser($ownerId),
            ],
        ]);
    }

    /**
     * Toggle a specific notification preference
     */
    public function toggle(Request $request): JsonResponse
    {
        $ownerId = $this->getPreferenceOwnerId($request);
        
        if (!$ownerId) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'channel' => 'required|string|in:' . implode(',', array_keys(NotificationPreference::CHANNELS)),
            'type' => 'required|string|in:' . implode(',', array_keys(NotificationPreference::TYPES)),
            'enabled' => 'required|boolean',
        ]);

        $pref = NotificationPreference::setPreference(
            $ownerId,
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
        $ownerId = $this->getPreferenceOwnerId($request);
        
        if (!$ownerId) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Disable all notification types for all channels
        $preferences = [];
        foreach (NotificationPreference::CHANNELS as $channel => $label) {
            foreach (NotificationPreference::TYPES as $type => $typeLabel) {
                $preferences[$channel][$type] = false;
            }
        }

        NotificationPreference::updateBulk($ownerId, $preferences);

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
        $ownerId = $this->getPreferenceOwnerId($request);
        
        if (!$ownerId) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Enable all notification types for all channels
        $preferences = [];
        foreach (NotificationPreference::CHANNELS as $channel => $label) {
            foreach (NotificationPreference::TYPES as $type => $typeLabel) {
                $preferences[$channel][$type] = true;
            }
        }

        NotificationPreference::updateBulk($ownerId, $preferences);

        return response()->json([
            'success' => true,
            'message' => 'All notifications enabled',
        ]);
    }
}

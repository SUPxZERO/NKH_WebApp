<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TargetedNotificationController extends Controller
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get targeting options for the UI
     */
    public function options(): JsonResponse
    {
        $locations = Location::select('id', 'name')->get();
        
        return response()->json([
            'success' => true,
            'data' => [
                'target_types' => NotificationService::getTargetOptions(),
                'roles' => NotificationService::getAvailableRoles(),
                'tiers' => NotificationService::getAvailableTiers(),
                'locations' => $locations,
                'notification_types' => [
                    'order' => 'Order Update',
                    'promotion' => 'Promotion',
                    'reward' => 'Reward/Loyalty',
                    'system' => 'System Announcement',
                ],
            ],
        ]);
    }

    /**
     * Preview recipient count before sending
     */
    public function preview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'target_type' => 'required|string',
            'roles' => 'array',
            'roles.*' => 'string',
            'tiers' => 'array',
            'tiers.*' => 'string',
            'location_ids' => 'array',
            'location_ids.*' => 'integer',
            'user_ids' => 'array',
            'user_ids.*' => 'integer',
            'days' => 'integer|min:1|max:365',
        ]);

        $params = $this->buildParams($validated);
        $count = $this->notificationService->getRecipientCountPreview(
            $validated['target_type'],
            $params
        );

        // Get sample recipients for preview
        $recipients = $this->notificationService->getRecipientsByTarget(
            $validated['target_type'],
            $params
        )->take(5);

        $sampleRecipients = $recipients->map(fn($user) => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'total_recipients' => $count,
                'sample_recipients' => $sampleRecipients,
            ],
        ]);
    }

    /**
     * Send targeted notification
     */
    public function send(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'target_type' => 'required|string',
            'title' => 'required|string|max:255',
            'message' => 'required|string|max:1000',
            'type' => 'required|string|in:order,promotion,reward,system',
            'action_url' => 'nullable|string|max:255',
            // Target parameters
            'roles' => 'array',
            'roles.*' => 'string',
            'tiers' => 'array',
            'tiers.*' => 'string',
            'location_ids' => 'array',
            'location_ids.*' => 'integer',
            'user_ids' => 'array',
            'user_ids.*' => 'integer',
            'days' => 'integer|min:1|max:365',
        ]);

        $params = $this->buildParams($validated);

        $notifications = $this->notificationService->sendTargeted(
            $validated['target_type'],
            $params,
            $validated['type'],
            $validated['title'],
            $validated['message'],
            $validated['action_url'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => "Notification sent to {$notifications->count()} recipient(s)",
            'data' => [
                'sent_count' => $notifications->count(),
            ],
        ]);
    }

    /**
     * Quick send to specific roles
     */
    public function sendToRoles(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'roles' => 'required|array|min:1',
            'roles.*' => 'string',
            'title' => 'required|string|max:255',
            'message' => 'required|string|max:1000',
            'action_url' => 'nullable|string|max:255',
        ]);

        $notifications = $this->notificationService->notifyByRole(
            $validated['roles'],
            $validated['title'],
            $validated['message'],
            $validated['action_url'] ?? null
        );

        $roleNames = implode(', ', $validated['roles']);

        return response()->json([
            'success' => true,
            'message' => "Notification sent to {$roleNames}: {$notifications->count()} recipient(s)",
            'data' => [
                'sent_count' => $notifications->count(),
            ],
        ]);
    }

    /**
     * Quick send to specific user(s)
     */
    public function sendToUsers(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'integer|exists:users,id',
            'title' => 'required|string|max:255',
            'message' => 'required|string|max:1000',
            'type' => 'string|in:order,promotion,reward,system',
            'action_url' => 'nullable|string|max:255',
        ]);

        $notifications = $this->notificationService->notifyUsers(
            $validated['user_ids'],
            $validated['title'],
            $validated['message'],
            $validated['action_url'] ?? null,
            $validated['type'] ?? 'system'
        );

        return response()->json([
            'success' => true,
            'message' => "Notification sent to {$notifications->count()} user(s)",
            'data' => [
                'sent_count' => $notifications->count(),
            ],
        ]);
    }

    /**
     * Search users for selection
     */
    public function searchUsers(Request $request): JsonResponse
    {
        $search = $request->get('search', '');
        
        $users = User::query()
            ->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            })
            ->select('id', 'name', 'email')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * Build params array from validated request data
     */
    private function buildParams(array $validated): array
    {
        $params = [];
        
        if (!empty($validated['roles'])) {
            $params['roles'] = $validated['roles'];
        }
        if (!empty($validated['tiers'])) {
            $params['tiers'] = $validated['tiers'];
        }
        if (!empty($validated['location_ids'])) {
            $params['location_ids'] = $validated['location_ids'];
        }
        if (!empty($validated['user_ids'])) {
            $params['user_ids'] = $validated['user_ids'];
        }
        if (!empty($validated['days'])) {
            $params['days'] = $validated['days'];
        }

        return $params;
    }
}

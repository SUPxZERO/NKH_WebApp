<?php

namespace App\Http\Controllers\Api\Telegram;

use App\Http\Controllers\Controller;
use App\Models\TelegramUser;
use App\Services\Telegram\TelegramBotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TelegramAdminController extends Controller
{
    private TelegramBotService $botService;

    public function __construct(TelegramBotService $botService)
    {
        $this->botService = $botService;
    }

    /**
     * Get bot statistics
     */
    public function stats(): JsonResponse
    {
        $totalUsers = TelegramUser::count();
        $activeUsers = TelegramUser::active()->count();
        $linkedUsers = TelegramUser::linked()->count();
        $notificationSubscribers = TelegramUser::withNotifications()->count();

        $today = now()->startOfDay();
        $activeToday = TelegramUser::where('last_interaction_at', '>=', $today)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_users' => $totalUsers,
                'active_users' => $activeUsers,
                'linked_accounts' => $linkedUsers,
                'notification_subscribers' => $notificationSubscribers,
                'active_today' => $activeToday,
            ],
        ]);
    }

    /**
     * List Telegram users
     */
    public function users(Request $request): JsonResponse
    {
        $query = TelegramUser::query();

        // Filter by linked status
        if ($request->filled('linked')) {
            if ($request->boolean('linked')) {
                $query->whereNotNull('customer_id');
            } else {
                $query->whereNull('customer_id');
            }
        }

        // Filter by active status
        if ($request->filled('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        // Filter by notifications
        if ($request->filled('notifications')) {
            $query->where('notifications_enabled', $request->boolean('notifications'));
        }

        // Pagination
        $perPage = min((int) $request->input('per_page', 20), 100);
        $users = $query->orderBy('last_interaction_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'telegram_id' => $user->telegram_id,
                    'username' => $user->telegram_username,
                    'display_name' => $user->display_name,
                    'has_linked_account' => $user->hasLinkedAccount(),
                    'customer_id' => $user->customer_id,
                    'is_active' => $user->is_active,
                    'notifications_enabled' => $user->notifications_enabled,
                    'last_interaction' => $user->last_interaction_at?->toISOString(),
                    'created_at' => $user->created_at->toISOString(),
                ];
            }),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    /**
     * Set webhook URL
     */
    public function setWebhook(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'url' => 'required|url',
        ]);

        $url = $validated['url'];
        $success = $this->botService->setWebhook($url);

        if ($success) {
            return response()->json([
                'success' => true,
                'message' => 'Webhook set successfully',
                'url' => $url,
            ]);
        }

        return response()->json([
            'success' => false,
            'error' => 'Failed to set webhook',
        ], 500);
    }

    /**
     * Get webhook info
     */
    public function webhookInfo(): JsonResponse
    {
        $info = $this->botService->getWebhookInfo();

        if ($info) {
            return response()->json([
                'success' => true,
                'data' => $info,
            ]);
        }

        return response()->json([
            'success' => false,
            'error' => 'Could not get webhook info',
        ], 500);
    }

    /**
     * Broadcast message to users
     */
    public function broadcast(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string',
            'target' => 'nullable|in:all,linked,active',
            'dry_run' => 'nullable|boolean',
        ]);

        $target = $validated['target'] ?? 'all';
        $message = $validated['message'];
        $dryRun = $validated['dry_run'] ?? false;

        // Get target users
        $query = TelegramUser::active()->withNotifications();

        match ($target) {
            'linked' => $query->whereNotNull('customer_id'),
            'active' => $query->where('last_interaction_at', '>=', now()->subDay()),
            default => $query,
        };

        $users = $query->get();
        $sent = 0;
        $failed = 0;

        if (!$dryRun) {
            foreach ($users as $user) {
                $result = $this->botService->sendMessage($user->telegram_id, $message);
                if ($result) {
                    $sent++;
                } else {
                    $failed++;
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => $dryRun ? 'Dry run completed' : 'Broadcast completed',
            'data' => [
                'target' => $target,
                'recipient_count' => $users->count(),
                'sent' => $sent,
                'failed' => $failed,
                'dry_run' => $dryRun,
            ],
        ]);
    }
}

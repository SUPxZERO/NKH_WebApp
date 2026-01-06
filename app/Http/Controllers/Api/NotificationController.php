<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\TelegramAwareAuth;
use Illuminate\Http\Request;
use App\Models\UserNotification;
use App\Models\BroadcastNotification;
use App\Models\User;
use Illuminate\Support\Str;

class NotificationController extends Controller
{
    use TelegramAwareAuth;

    public function index(Request $request)
    {
        // Get user ID - for Telegram guests, use pseudo ID based on customer
        $userId = $this->getUserIdForStorage($request);
        
        if (!$userId) {
            // For Telegram guests without linked user, return empty notifications
            // They can still receive Telegram notifications via bots
            if ($this->isTelegramGuest($request)) {
                return response()->json([
                    'data' => [],
                    'current_page' => 1,
                    'per_page' => 20,
                    'total' => 0,
                    'last_page' => 1,
                    'is_telegram_guest' => true,
                    'message' => 'In-app notifications are not available for Telegram guests. You receive notifications via Telegram.',
                ]);
            }
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Scope to the authenticated user using UserNotification model
        $query = UserNotification::where('user_id', $userId);

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%");
            });
        }

        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->has('status') && $request->status !== 'all') {
            if ($request->status === 'read') {
                $query->where('read', true);
            } else {
                $query->where('read', false);
            }
        }

        $notifications = $query->latest()->paginate($request->per_page ?? 20);

        // Transform if necessary, or return directly since structure is similar
        // Adjusting structure to match frontend expectations if needed
        $notifications->getCollection()->transform(function ($n) {
            return [
                'id' => $n->id,
                'title' => $n->title,
                'message' => $n->message,
                'type' => $n->type,
                'user_id' => $n->user_id,
                'read_at' => $n->read_at, // or create from 'read' status if read_at is null
                'created_at' => $n->created_at,
            ];
        });

        return response()->json($notifications);
    }


    /**
     * Admin specific index to view ALL notifications (grouped by broadcast + legacy)
     */
    public function adminIndex(Request $request)
    {
        $search = $request->search;
        $typeFilter = $request->type;
        $targetFilter = $request->target_type;
        $perPage = $request->per_page ?? 20;

        // Get broadcast notifications
        $broadcastQuery = BroadcastNotification::query()->with('creator:id,name');

        if ($search) {
            $broadcastQuery->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%");
            });
        }

        if ($typeFilter && $typeFilter !== 'all') {
            $broadcastQuery->where('type', $typeFilter);
        }

        if ($targetFilter && $targetFilter !== 'all') {
            $broadcastQuery->where('target_type', $targetFilter);
        }

        $broadcasts = $broadcastQuery->latest()->get()->map(function ($n) {
            return [
                'id' => 'broadcast_' . $n->id,
                'title' => $n->title,
                'message' => $n->message,
                'type' => $n->type,
                'target_type' => $n->target_type,
                'target_metadata' => $n->target_metadata,
                'recipient_count' => $n->recipient_count,
                'read_count' => $n->read_count,
                'unread_count' => $n->unread_count,
                'created_by' => $n->creator ? ['id' => $n->creator->id, 'name' => $n->creator->name] : null,
                'created_at' => $n->created_at,
                'is_broadcast' => true,
            ];
        });

        // Get legacy notifications (those without broadcast_notification_id) - grouped by title+message+created_at
        $legacyQuery = UserNotification::query()
            ->whereNull('broadcast_notification_id')
            ->select('title', 'message', 'type', 'target_type', 'target_metadata', 'created_at')
            ->selectRaw('MIN(id) as id')
            ->selectRaw('COUNT(*) as recipient_count')
            ->selectRaw('SUM(CASE WHEN `read` = 1 THEN 1 ELSE 0 END) as read_count')
            ->selectRaw('SUM(CASE WHEN `read` = 0 THEN 1 ELSE 0 END) as unread_count')
            ->groupBy('title', 'message', 'type', 'target_type', 'target_metadata', 'created_at');

        if ($search) {
            $legacyQuery->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%");
            });
        }

        if ($typeFilter && $typeFilter !== 'all') {
            $legacyQuery->where('type', $typeFilter);
        }

        if ($targetFilter && $targetFilter !== 'all') {
            $legacyQuery->where('target_type', $targetFilter);
        }

        $legacy = $legacyQuery->latest('created_at')->get()->map(function ($n) {
            return [
                'id' => 'legacy_' . $n->id,
                'title' => $n->title,
                'message' => $n->message,
                'type' => $n->type,
                'target_type' => $n->target_type,
                'target_metadata' => $n->target_metadata,
                'recipient_count' => $n->recipient_count,
                'read_count' => $n->read_count,
                'unread_count' => $n->unread_count,
                'created_by' => null,
                'created_at' => $n->created_at,
                'is_broadcast' => false,
            ];
        });

        // Merge and sort by created_at
        $allNotifications = $broadcasts->concat($legacy)->sortByDesc('created_at')->values();

        // Manual pagination
        $page = $request->page ?? 1;
        $offset = ($page - 1) * $perPage;
        $items = $allNotifications->slice($offset, $perPage)->values();
        $total = $allNotifications->count();

        return response()->json([
            'data' => $items,
            'current_page' => (int)$page,
            'per_page' => $perPage,
            'total' => $total,
            'last_page' => (int)ceil($total / $perPage),
        ]);
    }

    public function markAllRead(Request $request)
    {
        $userId = $this->getUserIdForStorage($request);
        
        if (!$userId) {
            if ($this->isTelegramGuest($request)) {
                return response()->json(['message' => 'No in-app notifications for Telegram guests']);
            }
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        
        UserNotification::where('user_id', $userId)
            ->where('read', false)
            ->update(['read' => true, 'read_at' => now()]);
        return response()->json(['message' => 'All marked as read']);
    }

    public function unreadCount(Request $request)
    {
        $userId = $this->getUserIdForStorage($request);
        
        if (!$userId) {
            // Telegram guests have 0 in-app notifications
            return response()->json(['count' => 0]);
        }
        
        return response()->json([
            'count' => UserNotification::where('user_id', $userId)->where('read', false)->count()
        ]);
    }

    public function stats()
    {
        // ... existing stats logic (probably for admin, keep separate or scope)
        return response()->json([
            'total' => UserNotification::count(),
            'unread' => UserNotification::where('read', false)->count(),
            'system_alerts' => UserNotification::where('type', 'system')->count(),
            'user_messages' => UserNotification::where('type', '!=', 'system')->count(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required',
            'message' => 'required',
            'type' => 'required',
        ]);

        $data = [
            'title' => $request->title,
            'message' => $request->message,
            'type' => $request->type,
        ];

        $users = $request->user_id ? User::where('id', $request->user_id)->get() : User::all();

        foreach ($users as $user) {
            UserNotification::create([
                'user_id' => $user->id,
                'type' => $request->type,
                'title' => $request->title,
                'message' => $request->message,
                'read' => false,
            ]);
        }

        return response()->json(['message' => 'Notification sent']);
    }

    public function markAsRead($id)
    {
        $notification = UserNotification::find($id);
        if ($notification) {
            $notification->update(['read' => true, 'read_at' => now()]);
        }
        return response()->json(['message' => 'Marked as read']);
    }

    public function destroy($id)
    {
        $notification = UserNotification::find($id);
        if ($notification) {
            $notification->delete();
        }
        return response()->json(['message' => 'Deleted']);
    }
}

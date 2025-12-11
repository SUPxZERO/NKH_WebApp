<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use App\Models\User;
use Illuminate\Support\Str;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Scope to the authenticated user
        $query = $user->notifications();

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                // JSON structure querying depends on DB driver, valid for MySQL/Postgres
                $q->where('data->title', 'like', "%{$search}%")
                  ->orWhere('data->message', 'like', "%{$search}%");
            });
        }

        if ($request->has('type') && $request->type !== 'all') {
            $query->where('data->type', $request->type);
        }

        if ($request->has('status') && $request->status !== 'all') {
            if ($request->status === 'read') {
                $query->whereNotNull('read_at');
            } else {
                $query->whereNull('read_at');
            }
        }

        $notifications = $query->latest()->paginate($request->per_page ?? 20);

        $notifications->getCollection()->transform(function ($n) {
            return [
                'id' => $n->id,
                'title' => $n->data['title'] ?? 'No Title',
                'message' => $n->data['message'] ?? '',
                'type' => $n->data['type'] ?? 'info',
                'user_id' => $n->notifiable_id,
                // 'user' => $n->notifiable ? ['name' => $n->notifiable->name] : null, // Redundant for own notifications
                'read_at' => $n->read_at,
                'created_at' => $n->created_at,
            ];
        });

        return response()->json($notifications);
    }

    public function markAllRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();
        return response()->json(['message' => 'All marked as read']);
    }

    public function unreadCount(Request $request)
    {
        return response()->json([
            'count' => $request->user()->unreadNotifications()->count()
        ]);
    }

    public function stats()
    {
        // ... existing stats logic (probably for admin, keep separate or scope)
        return response()->json([
            'total' => DatabaseNotification::count(),
            'unread' => DatabaseNotification::whereNull('read_at')->count(),
            'system_alerts' => DatabaseNotification::where('data->type', 'system')->count(),
            'user_messages' => DatabaseNotification::where('data->type', '!=', 'system')->count(),
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
            $user->notifications()->create([
                'id' => Str::uuid(),
                'type' => 'SystemNotification',
                'data' => $data,
                'read_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json(['message' => 'Notification sent']);
    }

    public function markAsRead($id)
    {
        $notification = DatabaseNotification::find($id);
        if ($notification) {
            $notification->markAsRead();
        }
        return response()->json(['message' => 'Marked as read']);
    }

    public function destroy($id)
    {
        $notification = DatabaseNotification::find($id);
        if ($notification) {
            $notification->delete();
        }
        return response()->json(['message' => 'Deleted']);
    }
}

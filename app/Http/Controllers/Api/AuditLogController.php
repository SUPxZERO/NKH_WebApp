<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;

class AuditLogController extends Controller
{
    // GET /api/admin/audit-logs
    public function index(Request $request)
    {
        $query = AuditLog::query()->with('user');

        if ($request->filled('action') && $request->action !== 'all') {
            $query->where('action', 'like', '%'.$request->string('action').'%');
        }

        if ($request->filled('user_id') && $request->user_id !== 'all') {
            $query->where('user_id', (int) $request->user_id);
        }

        if ($request->filled('search')) {
            $s = $request->string('search');
            $query->where(function ($q) use ($s) {
                $q->where('ip_address', 'like', "%{$s}%")
                  ->orWhere('user_agent', 'like', "%{$s}%")
                  ->orWhere('action', 'like', "%{$s}%")
                  ->orWhere('auditable_type', 'like', "%{$s}%")
                  ->orWhere('auditable_id', 'like', "%{$s}%");
            });
        }

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date('date'));
        }
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->date('start_date'));
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->date('end_date'));
        }

        return $query->orderByDesc('created_at')
                     ->orderByDesc('id')
                     ->paginate($request->integer('per_page', 15));
    }

    // GET /api/admin/audit-stats
    public function stats(): JsonResponse
    {
        $today = now()->toDateString();
        $todayCount = AuditLog::whereDate('created_at', $today)->count();
        $uniqueUsers = AuditLog::distinct('user_id')->count('user_id');
        $topAction = AuditLog::select('action', DB::raw('COUNT(*) as cnt'))
            ->groupBy('action')
            ->orderByDesc('cnt')
            ->limit(1)
            ->value('action') ?? 'N/A';

        return response()->json([
            'today_count' => $todayCount,
            'unique_users' => $uniqueUsers,
            'top_action' => $topAction,
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditLogController extends Controller
{
    /**
     * GET /api/admin/audit-logs
     * 
     * List audit logs with advanced filtering and pagination
     * Requires: audit.view permission
     */
    public function index(Request $request)
    {
        $query = AuditLog::query()->with('user');

        // Filter by action
        if ($request->filled('action') && $request->action !== 'all') {
            $query->where('action', $request->string('action'));
        }

        // Filter by user
        if ($request->filled('user_id') && $request->user_id !== 'all') {
            $query->where('user_id', (int) $request->user_id);
        }

        // Filter by guard (web/api/admin)
        if ($request->filled('guard') && $request->guard !== 'all') {
            $query->where('guard', $request->string('guard'));
        }

        // Filter by source (web/api/admin/job)
        if ($request->filled('source') && $request->source !== 'all') {
            $query->where('source', $request->string('source'));
        }

        // Filter by role
        if ($request->filled('role') && $request->role !== 'all') {
            $query->where('user_role', $request->string('role'));
        }

        // Filter by status (success/failed)
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->string('status'));
        }

        // Search (full-text across multiple fields)
        if ($request->filled('search')) {
            $s = $request->string('search');
            $query->where(function ($q) use ($s) {
                $q->where('ip_address', 'like', "%{$s}%")
                  ->orWhere('user_agent', 'like', "%{$s}%")
                  ->orWhere('action', 'like', "%{$s}%")
                  ->orWhere('route', 'like', "%{$s}%")
                  ->orWhere('auditable_type', 'like', "%{$s}%")
                  ->orWhere('request_id', 'like', "%{$s}%");
            });
        }

        // Filter by date range
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date('date'));
        }
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->date('start_date'));
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->date('end_date'));
        }

        // Sorting (default: newest first)
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        
        if (in_array($sortBy, ['created_at', 'action', 'user_id', 'status'])) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderByDesc('created_at');
        }

        // Always sort by ID as secondary (for consistency with same timestamp)
        $query->orderByDesc('id');

        // Pagination
        $perPage = $request->integer('per_page', 20);
        $perPage = min($perPage, 100); // Cap at 100 for performance

        return $query->paginate($perPage);
    }

    /**
     * GET /api/admin/audit-logs/{id}
     * 
     * Get a single audit log with all details
     * Requires: audit.view permission
     */
    public function show(AuditLog $auditLog)
    {
        return response()->json([
            'data' => $auditLog->load('user'),
        ]);
    }

    /**
     * GET /api/admin/audit-stats
     * 
     * Get aggregate statistics for audit logs
     * Requires: audit.view permission
     */
    public function stats(): JsonResponse
    {
        $today = now()->toDateString();
        
        $stats = [
            // Count statistics
            'total_logs' => AuditLog::count(),
            'today_logs' => AuditLog::whereDate('created_at', $today)->count(),
            'week_logs' => AuditLog::since(now()->subWeek())->count(),
            'month_logs' => AuditLog::since(now()->subMonth())->count(),
            
            // User statistics
            'unique_users' => AuditLog::distinct('user_id')->count('user_id'),
            'active_users_today' => AuditLog::whereDate('created_at', $today)->distinct('user_id')->count('user_id'),
            
            // Action statistics
            'top_action' => AuditLog::select('action', DB::raw('COUNT(*) as count'))
                ->groupBy('action')
                ->orderByDesc('count')
                ->limit(1)
                ->value('action') ?? 'N/A',
            
            'top_actions' => AuditLog::select('action', DB::raw('COUNT(*) as count'))
                ->groupBy('action')
                ->orderByDesc('count')
                ->limit(5)
                ->pluck('count', 'action'),
            
            // Status statistics
            'success_count' => AuditLog::where('status', 'success')->count(),
            'failed_count' => AuditLog::where('status', 'failed')->count(),
            
            // Source statistics
            'by_source' => AuditLog::select('source', DB::raw('COUNT(*) as count'))
                ->groupBy('source')
                ->pluck('count', 'source'),
            
            // Guard statistics (web/api/admin)
            'by_guard' => AuditLog::select('guard', DB::raw('COUNT(*) as count'))
                ->groupBy('guard')
                ->pluck('count', 'guard'),
            
            // Recent activity
            'latest_timestamp' => AuditLog::latest('created_at')->value('created_at'),
        ];

        return response()->json([
            'data' => $stats,
        ]);
    }

    /**
     * GET /api/admin/audit-logs/export/csv
     * 
     * Export audit logs as CSV
     * Requires: audit.export permission
     */
    public function exportCsv(Request $request): StreamedResponse
    {
        // Build query with filters (same as index)
        $query = AuditLog::query()->with('user');

        if ($request->filled('action') && $request->action !== 'all') {
            $query->where('action', $request->string('action'));
        }
        if ($request->filled('user_id') && $request->user_id !== 'all') {
            $query->where('user_id', (int) $request->user_id);
        }
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->date('start_date'));
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->date('end_date'));
        }

        $logs = $query->orderByDesc('created_at')->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="audit-logs-' . now()->format('Y-m-d') . '.csv"',
        ];

        return new StreamedResponse(function () use ($logs) {
            $file = fopen('php://output', 'w');
            fputcsv($file, [
                'ID', 'User', 'Email', 'Action', 'Model', 'Model ID', 'Route', 'Method', 
                'IP Address', 'Source', 'Guard', 'Status', 'Created At'
            ]);

            foreach ($logs as $log) {
                fputcsv($file, [
                    $log->id,
                    $log->user?->name ?? 'System',
                    $log->user?->email ?? '-',
                    $log->action,
                    $log->auditable_type ? class_basename($log->auditable_type) : '-',
                    $log->auditable_id ?? '-',
                    $log->route ?? '-',
                    $log->method ?? '-',
                    $log->ip_address ?? '-',
                    $log->source ?? '-',
                    $log->guard ?? '-',
                    $log->status ?? 'success',
                    $log->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($file);
        }, 200, $headers);
    }

    /**
     * GET /api/admin/audit-logs/export/json
     * 
     * Export audit logs as JSON
     * Requires: audit.export permission
     */
    public function exportJson(Request $request): JsonResponse
    {
        // Build query with filters (same as index)
        $query = AuditLog::query()->with('user');

        if ($request->filled('action') && $request->action !== 'all') {
            $query->where('action', $request->string('action'));
        }
        if ($request->filled('user_id') && $request->user_id !== 'all') {
            $query->where('user_id', (int) $request->user_id);
        }
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->date('start_date'));
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->date('end_date'));
        }

        $logs = $query->orderByDesc('created_at')->get();

        return response()->json([
            'data' => $logs,
            'exported_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get available filter options
     * 
     * GET /api/admin/audit-logs/filters
     * Returns: actions, users, guards, sources, roles, statuses
     */
    public function filters(): JsonResponse
    {
        return response()->json([
            'data' => [
                'actions' => AuditLog::distinct('action')->orderBy('action')->pluck('action'),
                'users' => AuditLog::with('user')
                    ->distinct('user_id')
                    ->whereNotNull('user_id')
                    ->pluck('user.name', 'user_id'),
                'guards' => AuditLog::distinct('guard')->whereNotNull('guard')->orderBy('guard')->pluck('guard'),
                'sources' => AuditLog::distinct('source')->whereNotNull('source')->orderBy('source')->pluck('source'),
                'roles' => AuditLog::distinct('user_role')->whereNotNull('user_role')->orderBy('user_role')->pluck('user_role'),
                'statuses' => ['success', 'failed'],
            ],
        ]);
    }
}
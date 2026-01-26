<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    /**
     * SECURITY: Audit logs are append-only
     * Using $fillable to explicitly allow internal system writes
     * AuditLog should NEVER be created/updated via user input - only via AuditService
     */
    protected $guarded = ['id']; // Only protect ID, allow all other fields for internal logging


    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'metadata' => 'array',
        'before_data' => 'array',
        'after_data' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who performed the action
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the auditable model (polymorphic relation)
     * 
     * This allows you to do:
     * $log->auditable // returns the actual model instance (Order, Payment, User, etc)
     * $log->auditable_type // returns 'App\Models\Order'
     * $log->auditable_id // returns the ID
     */
    public function auditable()
    {
        return $this->morphTo();
    }

    /**
     * Scope: Filter by action type
     * 
     * Usage: AuditLog::byAction('created')->get()
     */
    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope: Filter by user
     * 
     * Usage: AuditLog::byUser($userId)->get()
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope: Filter by model type
     * 
     * Usage: AuditLog::byModel(Order::class)->get()
     */
    public function scopeByModel($query, string $modelClass)
    {
        return $query->where('auditable_type', $modelClass);
    }

    /**
     * Scope: Filter by date range
     * 
     * Usage: AuditLog::since($date)->get()
     */
    public function scopeSince($query, $date)
    {
        return $query->where('created_at', '>=', $date);
    }

    /**
     * Scope: Filter by guard (web/api/admin)
     * 
     * Usage: AuditLog::byGuard('admin')->get()
     */
    public function scopeByGuard($query, string $guard)
    {
        return $query->where('guard', $guard);
    }

    /**
     * Scope: Filter by source (web/api/admin/job)
     * 
     * Usage: AuditLog::bySource('admin')->get()
     */
    public function scopeBySource($query, string $source)
    {
        return $query->where('source', $source);
    }

    /**
     * Scope: Filter successful actions only
     * 
     * Usage: AuditLog::successful()->get()
     */
    public function scopeSuccessful($query)
    {
        return $query->where('status', 'success');
    }

    /**
     * Scope: Filter failed actions only
     * 
     * Usage: AuditLog::failed()->get()
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Get all unique actions in the system
     * Useful for filter dropdowns
     */
    public static function getActions()
    {
        return static::distinct()
            ->pluck('action')
            ->sort()
            ->values();
    }

    /**
     * Get audit logs for a specific period with aggregation
     * 
     * @param string $period 'hour', 'day', 'week', 'month'
     * @return \Illuminate\Support\Collection
     */
    public static function aggregateByPeriod(string $period = 'day')
    {
        return match ($period) {
            'hour' => static::select(
                \DB::raw("DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as period"),
                \DB::raw('COUNT(*) as count'),
                'action'
            )->groupBy('period', 'action')->get(),
            'day' => static::select(
                \DB::raw("DATE(created_at) as period"),
                \DB::raw('COUNT(*) as count'),
                'action'
            )->groupBy('period', 'action')->get(),
            'week' => static::select(
                \DB::raw("DATE(DATE_SUB(created_at, INTERVAL DAYOFWEEK(created_at)-1 DAY)) as period"),
                \DB::raw('COUNT(*) as count'),
                'action'
            )->groupBy('period', 'action')->get(),
            'month' => static::select(
                \DB::raw("DATE_FORMAT(created_at, '%Y-%m-01') as period"),
                \DB::raw('COUNT(*) as count'),
                'action'
            )->groupBy('period', 'action')->get(),
            default => static::all(),
        };
    }
}
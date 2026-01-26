<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Str;
use Exception;
use Illuminate\Support\Facades\Log;

class AuditService
{
    /**
     * Log an audit event
     * 
     * @param string $action Action being performed (e.g., 'created', 'updated', 'deleted', 'login')
     * @param Model|string $model Model instance or class name
     * @param array|null $before Previous state of model (optional)
     * @param array|null $after New state of model (optional)
     * @param array $metadata Custom metadata (transaction_id, reference_no, etc)
     * @return AuditLog|null
     */
    public static function log(
        string $action,
        Model|string|null $model = null,
        ?array $before = null,
        ?array $after = null,
        array $metadata = []
    ): ?AuditLog {
        try {
            $auditData = static::buildAuditData(
                action: $action,
                model: $model,
                before: $before,
                after: $after,
                metadata: $metadata
            );

            return AuditLog::create($auditData);
        } catch (Exception $e) {
            // Log to Laravel logs but don't throw - audit failure shouldn't break app
            Log::error('Audit logging failed', [
                'action' => $action,
                'model' => $model instanceof Model ? $model::class : $model,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return null;
        }
    }

    /**
     * Build complete audit data from all available sources
     * 
     * @return array
     */
    private static function buildAuditData(
        string $action,
        Model|string|null $model = null,
        ?array $before = null,
        ?array $after = null,
        array $metadata = []
    ): array {
        $user = Auth::user();
        $request = Request::getFacadeRoot();
        $context = static::captureContext($request);

        // Determine guard
        $guard = Auth::getDefaultDriver();
        foreach (['web', 'api', 'admin'] as $g) {
            if (Auth::guard($g)->check()) {
                $guard = $g;
                break;
            }
        }

        // Auditable model info
        $auditableType = null;
        $auditableId = null;
        if ($model instanceof Model) {
            $auditableType = $model::class;
            $auditableId = $model->getKey();
        } elseif (is_string($model) && class_exists($model)) {
            $auditableType = $model;
        }

        // Source detection
        $source = static::detectSource($request, $context);

        // Create change summary
        $changeSummary = static::generateChangeSummary($action, $before, $after);

        // Build the audit record
        return [
            'user_id' => $user?->id,
            'guard' => $guard,
            'user_role' => $user?->roles?->first()?->name ?? $user?->role,
            'action' => $action,
            'auditable_type' => $auditableType,
            'auditable_id' => $auditableId,
            'ip_address' => $context['ip_address'],
            'user_agent' => $context['user_agent'],
            'route' => $context['route'],
            'method' => $context['method'],
            'request_id' => $context['request_id'],
            'session_id' => $context['session_id'],
            'source' => $source,
            'before_data' => $before ? static::serializeData($before) : null,
            'after_data' => $after ? static::serializeData($after) : null,
            'change_summary' => $changeSummary,
            'status' => 'success',
            'error_message' => null,
            'metadata' => !empty($metadata) ? $metadata : null,
        ];
    }

    /**
     * Capture HTTP request context
     * 
     * @param \Illuminate\Http\Request $request
     * @return array
     */
    private static function captureContext($request): array
    {
        // Handle console context where HTTP request/session may not be available
        $sessionId = null;
        try {
            if (!app()->runningInConsole() && session()->isStarted()) {
                $sessionId = session()->getId();
            }
        } catch (\Exception $e) {
            // Session not available in console context
        }

        return [
            'ip_address' => static::getClientIp($request),
            'user_agent' => $request?->userAgent(),
            'route' => $request?->route()?->getName(),
            'method' => $request?->method() ?? 'CLI',
            'request_id' => $request?->header('X-Request-ID') ?? Str::uuid()->toString(),
            'session_id' => $sessionId,
        ];
    }


    /**
     * Get client IP address (handle proxies)
     * 
     * @param \Illuminate\Http\Request|null $request
     * @return string|null
     */
    private static function getClientIp($request): ?string
    {
        if (!$request) {
            return null; // Console context
        }

        // Check for IP set by proxy (Cloudflare, AWS ALB, nginx, etc)
        if ($request->header('CF-Connecting-IP')) {
            return $request->header('CF-Connecting-IP');
        }
        if ($request->header('X-Forwarded-For')) {
            $ips = explode(',', $request->header('X-Forwarded-For'));
            return trim($ips[0]);
        }
        if ($request->header('X-Real-IP')) {
            return $request->header('X-Real-IP');
        }

        return $request->ip();
    }

    /**
     * Detect source of action
     * 
     * @param \Illuminate\Http\Request $request
     * @param array $context
     * @return string
     */
    private static function detectSource($request, array $context): string
    {
        // If it's a queued job or command
        if (app()->runningInConsole()) {
            return 'job';
        }

        // If it's an API request
        if (str_starts_with($context['route'] ?? '', 'api.')) {
            return 'api';
        }

        // If it's an admin request
        if (str_contains($context['route'] ?? '', 'admin')) {
            return 'admin';
        }

        // Check X-Source header (for explicit source)
        if ($source = $request->header('X-Audit-Source')) {
            return $source;
        }

        // Default to web
        return 'web';
    }

    /**
     * Serialize data for JSON storage (handle non-serializable objects)
     * 
     * @param array $data
     * @return array
     */
    private static function serializeData(array $data): array
    {
        $serialized = [];

        foreach ($data as $key => $value) {
            // Skip sensitive fields
            if (static::isSensitive($key)) {
                $serialized[$key] = '[REDACTED]';
                continue;
            }

            // Convert model instances to ID
            if ($value instanceof Model) {
                $serialized[$key] = $value->getKey();
                continue;
            }

            // Skip closures and resources
            if (is_resource($value) || $value instanceof \Closure) {
                $serialized[$key] = '[UNSERIALIZABLE]';
                continue;
            }

            // Keep primitives and arrays
            if (is_scalar($value) || is_array($value) || is_null($value)) {
                $serialized[$key] = $value;
                continue;
            }

            // Try to cast objects to string
            try {
                $serialized[$key] = (string) $value;
            } catch (Exception $e) {
                $serialized[$key] = '[UNSERIALIZABLE]';
            }
        }

        return $serialized;
    }

    /**
     * Check if a field is sensitive and should be redacted
     * 
     * @param string $key
     * @return bool
     */
    private static function isSensitive(string $key): bool
    {
        $sensitiveFields = [
            'password',
            'password_confirmation',
            'secret',
            'token',
            'api_key',
            'stripe_token',
            'credit_card',
            'card_number',
            'cvv',
            'ssn',
            'pin',
            'otp',
            'mfa_secret',
            'remember_token',
            'access_token',
            'refresh_token',
            'authorization',
        ];

        $lower = strtolower($key);
        foreach ($sensitiveFields as $field) {
            if (str_contains($lower, $field)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Generate human-readable change summary
     * 
     * @param string $action
     * @param array|null $before
     * @param array|null $after
     * @return string|null
     */
    private static function generateChangeSummary(
        string $action,
        ?array $before = null,
        ?array $after = null
    ): ?string {
        return match ($action) {
            'created' => 'Created new record',
            'deleted' => 'Deleted record',
            'restored' => 'Restored deleted record',
            'login' => 'User logged in',
            'logout' => 'User logged out',
            'register' => 'New user registered',
            'updated' => static::summarizeUpdates($before, $after),
            default => null,
        };
    }

    /**
     * Summarize updated fields
     * 
     * @param array|null $before
     * @param array|null $after
     * @return string|null
     */
    private static function summarizeUpdates(?array $before, ?array $after): ?string
    {
        if (!$before || !$after) {
            return 'Record updated';
        }

        $changes = [];
        foreach ($after as $key => $newValue) {
            $oldValue = $before[$key] ?? null;
            if ($oldValue !== $newValue) {
                $changes[] = "$key: '$oldValue' → '$newValue'";
            }
        }

        if (empty($changes)) {
            return 'Record updated';
        }

        // Limit to 3 changes in summary
        $summary = implode(', ', array_slice($changes, 0, 3));
        if (count($changes) > 3) {
            $summary .= ' (and ' . (count($changes) - 3) . ' more)';
        }

        return 'Updated: ' . $summary;
    }

    /**
     * Log a failed action
     * 
     * @param string $action
     * @param string $errorMessage
     * @param array $context
     * @return AuditLog|null
     */
    public static function logFailure(
        string $action,
        string $errorMessage,
        array $context = []
    ): ?AuditLog {
        try {
            $user = Auth::user();
            $request = Request::getFacadeRoot();
            $requestContext = static::captureContext($request);
            $guard = Auth::getDefaultDriver();

            $source = static::detectSource($request, $requestContext);

            return AuditLog::create([
                'user_id' => $user?->id,
                'guard' => $guard,
                'user_role' => $user?->roles?->first()?->name ?? $user?->role,
                'action' => $action,
                'ip_address' => $requestContext['ip_address'],
                'user_agent' => $requestContext['user_agent'],
                'route' => $requestContext['route'],
                'method' => $requestContext['method'],
                'request_id' => $requestContext['request_id'],
                'session_id' => $requestContext['session_id'],
                'source' => $source,
                'status' => 'failed',
                'error_message' => $errorMessage,
                'metadata' => !empty($context) ? $context : null,
            ]);
        } catch (Exception $e) {
            Log::error('Failed to log audit failure', [
                'action' => $action,
                'error' => $errorMessage,
                'trace' => $e->getMessage(),
            ]);
            return null;
        }
    }
}

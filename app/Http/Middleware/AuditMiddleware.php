<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Audit Middleware
 * 
 * Injects request context (request_id, X-Request-ID) that gets captured by AuditService.
 * This middleware should be registered in app/Http/Kernel.php in the appropriate middleware groups.
 * 
 * For maximum audit coverage, register in:
 * - api middleware group (for API routes)
 * - web middleware group (for web routes)
 */
class AuditMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Generate or retrieve request ID for request tracing
        $requestId = $request->header('X-Request-ID') ?? Str::uuid()->toString();
        
        // Set request ID for this request (will be picked up by AuditService)
        $request->headers->set('X-Request-ID', $requestId);
        
        // Store in request for easy access in controllers/services
        $request->merge(['_audit_request_id' => $requestId]);

        // Continue to next middleware
        $response = $next($request);

        // Add request ID to response headers for tracing
        $response->headers->set('X-Request-ID', $requestId);

        return $response;
    }
}

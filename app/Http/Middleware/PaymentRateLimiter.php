<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Cache\RateLimiter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class PaymentRateLimiter
{
    protected RateLimiter $limiter;

    /**
     * Rate limit configurations per action type.
     */
    protected array $limits = [
        'initiate' => ['attempts' => 10, 'decay' => 60],      // 10 per minute
        'status' => ['attempts' => 60, 'decay' => 60],        // 60 per minute
        'webhook' => ['attempts' => 100, 'decay' => 60],      // 100 per minute
        'simulate' => ['attempts' => 20, 'decay' => 60],      // 20 per minute (dev only)
        'refund' => ['attempts' => 5, 'decay' => 60],         // 5 per minute
        'receipt' => ['attempts' => 30, 'decay' => 60],       // 30 per minute
        'default' => ['attempts' => 30, 'decay' => 60],       // 30 per minute
    ];

    public function __construct(RateLimiter $limiter)
    {
        $this->limiter = $limiter;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $action  The action type (initiate, status, webhook, etc.)
     */
    public function handle(Request $request, Closure $next, string $action = 'default'): Response
    {
        // Skip rate limiting in testing
        if (app()->runningUnitTests()) {
            return $next($request);
        }

        // Get limit configuration
        $config = $this->limits[$action] ?? $this->limits['default'];
        
        // Override from config if available
        $configKey = "payment.rate_limits.{$action}";
        if (config()->has($configKey)) {
            $configLimit = config($configKey);
            if (is_array($configLimit)) {
                $config = array_merge($config, $configLimit);
            }
        }

        // Build unique key based on IP and user
        $key = $this->resolveRequestKey($request, $action);

        if ($this->limiter->tooManyAttempts($key, $config['attempts'])) {
            Log::warning('Payment rate limit exceeded', [
                'action' => $action,
                'key' => $key,
                'ip' => $request->ip(),
                'user_id' => $request->user()?->id,
            ]);

            return $this->buildTooManyAttemptsResponse($key, $config['attempts']);
        }

        $this->limiter->hit($key, $config['decay']);

        $response = $next($request);

        // Add rate limit headers
        return $this->addHeaders(
            $response,
            $config['attempts'],
            $this->limiter->remaining($key, $config['attempts'])
        );
    }

    /**
     * Resolve the request signature key.
     */
    protected function resolveRequestKey(Request $request, string $action): string
    {
        $identifier = $request->user()?->id ?? $request->ip();
        
        return "payment_rate_limit:{$action}:{$identifier}";
    }

    /**
     * Build the too many attempts response.
     */
    protected function buildTooManyAttemptsResponse(string $key, int $maxAttempts): Response
    {
        $retryAfter = $this->limiter->availableIn($key);

        return response()->json([
            'success' => false,
            'error' => 'Too many requests. Please try again later.',
            'retry_after' => $retryAfter,
        ], 429)->withHeaders([
            'X-RateLimit-Limit' => $maxAttempts,
            'X-RateLimit-Remaining' => 0,
            'Retry-After' => $retryAfter,
        ]);
    }

    /**
     * Add rate limit headers to response.
     */
    protected function addHeaders(Response $response, int $maxAttempts, int $remaining): Response
    {
        $response->headers->add([
            'X-RateLimit-Limit' => $maxAttempts,
            'X-RateLimit-Remaining' => max(0, $remaining),
        ]);

        return $response;
    }
}

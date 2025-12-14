<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Cache\RateLimiter;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class GlobalApiRateLimiter
{
    protected RateLimiter $limiter;

    public function __construct(RateLimiter $limiter)
    {
        $this->limiter = $limiter;
    }

    /**
     * Handle an incoming request.
     * 
     * Applies tiered rate limiting based on endpoint sensitivity:
     * - Auth endpoints: 5 requests per minute
     * - Sensitive endpoints: 20 requests per minute  
     * - General API: 100 requests per minute
     */
    public function handle(Request $request, Closure $next, string $tier = 'api'): Response
    {
        $key = $this->resolveRequestKey($request, $tier);
        $limits = $this->getLimits($tier);

        if ($this->limiter->tooManyAttempts($key, $limits['max'])) {
            $retryAfter = $this->limiter->availableIn($key);
            
            return response()->json([
                'message' => 'Too many requests. Please try again later.',
                'retry_after' => $retryAfter,
            ], 429)->withHeaders([
                'Retry-After' => $retryAfter,
                'X-RateLimit-Limit' => $limits['max'],
                'X-RateLimit-Remaining' => 0,
            ]);
        }

        $this->limiter->hit($key, $limits['decay']);

        $response = $next($request);

        return $response->withHeaders([
            'X-RateLimit-Limit' => $limits['max'],
            'X-RateLimit-Remaining' => $limits['max'] - $this->limiter->attempts($key),
        ]);
    }

    /**
     * Generate a unique key for rate limiting.
     */
    protected function resolveRequestKey(Request $request, string $tier): string
    {
        $identifier = $request->user()?->id ?? $request->ip();
        return "rate_limit:{$tier}:{$identifier}";
    }

    /**
     * Get rate limits for the specified tier.
     */
    protected function getLimits(string $tier): array
    {
        return match ($tier) {
            'auth' => ['max' => 5, 'decay' => 60],      // 5 per minute
            'sensitive' => ['max' => 20, 'decay' => 60], // 20 per minute
            'api' => ['max' => 100, 'decay' => 60],      // 100 per minute
            default => ['max' => 100, 'decay' => 60],
        };
    }
}

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class PaymentRateLimiter
{
    /**
     * Rate limiting configuration.
     */
    protected array $limits = [
        'initiate' => ['max' => 10, 'decay' => 60],      // 10 initiations per minute
        'webhook' => ['max' => 100, 'decay' => 60],      // 100 webhooks per minute
        'status' => ['max' => 60, 'decay' => 60],        // 60 status checks per minute
        'simulate' => ['max' => 20, 'decay' => 60],      // 20 simulations per minute
        'default' => ['max' => 30, 'decay' => 60],       // 30 requests per minute
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $action = 'default'): Response
    {
        $key = $this->resolveKey($request, $action);
        $limits = $this->limits[$action] ?? $this->limits['default'];

        $attempts = Cache::get($key, 0);

        if ($attempts >= $limits['max']) {
            Log::warning('Payment rate limit exceeded', [
                'ip' => $request->ip(),
                'action' => $action,
                'attempts' => $attempts,
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Too many requests. Please try again later.',
                'retry_after' => $limits['decay'],
            ], 429);
        }

        Cache::put($key, $attempts + 1, $limits['decay']);

        $response = $next($request);

        // Add rate limit headers
        $response->headers->set('X-RateLimit-Limit', $limits['max']);
        $response->headers->set('X-RateLimit-Remaining', max(0, $limits['max'] - $attempts - 1));

        return $response;
    }

    /**
     * Generate cache key for rate limiting.
     */
    protected function resolveKey(Request $request, string $action): string
    {
        $identifier = $request->user()?->id ?? $request->ip();
        return "payment_rate_limit:{$action}:{$identifier}";
    }
}

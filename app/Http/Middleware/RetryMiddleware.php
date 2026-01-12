<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Retry Middleware
 * 
 * FIX: Phase 4 - Architecture Cleanup
 * Automatically retries requests that fail due to transient database errors
 * (deadlocks, lock timeouts) with exponential backoff
 */
class RetryMiddleware
{
    /**
     * Handle an incoming request with retry logic
     *
     * @param Request $request
     * @param Closure $next
     * @param int $maxAttempts Maximum number of retry attempts
     * @return Response
     */
    public function handle(Request $request, Closure $next, int $maxAttempts = 3): Response
    {
        $attempt = 0;
        $lastException = null;

        while ($attempt < $maxAttempts) {
            try {
                return $next($request);
            } catch (QueryException $e) {
                $attempt++;
                $lastException = $e;

                // Only retry on specific retryable errors
                if (!$this->isRetryable($e) || $attempt >= $maxAttempts) {
                    throw $e;
                }

                // Exponential backoff: 100ms, 200ms, 400ms
                $delayMs = 100000 * pow(2, $attempt - 1);
                usleep($delayMs);

                Log::warning('Retrying request due to transient database error', [
                    'attempt' => $attempt,
                    'max_attempts' => $maxAttempts,
                    'url' => $request->url(),
                    'method' => $request->method(),
                    'error_code' => $e->getCode(),
                    'error_message' => $e->getMessage(),
                    'delay_ms' => $delayMs / 1000,
                ]);
            } catch (\Exception $e) {
                // Don't retry non-database exceptions
                throw $e;
            }
        }

        // This should never be reached, but throw last exception just in case
        throw $lastException;
    }

    /**
     * Determine if the exception is retryable
     *
     * @param QueryException $e
     * @return bool
     */
    private function isRetryable(QueryException $e): bool
    {
        // MySQL error codes that are typically transient
        $retryableErrorCodes = [
            1205, // Lock wait timeout exceeded
            1213, // Deadlock found when trying to get lock
            2006, // MySQL server has gone away
            2013, // Lost connection to MySQL server during query
        ];

        $errorCode = $e->errorInfo[1] ?? $e->getCode();

        return in_array($errorCode, $retryableErrorCodes);
    }
}

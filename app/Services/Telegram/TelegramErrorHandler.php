<?php

namespace App\Services\Telegram;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Exception;
use Throwable;

/**
 * Telegram Error Handler with Retry Logic
 *
 * Handles errors gracefully with:
 * - Automatic retry for transient failures
 * - Rate limit detection and backoff
 * - User-friendly error messages
 * - Error categorization
 */
class TelegramErrorHandler
{
    /**
     * Error types
     */
    public const ERROR_TRANSIENT = 'transient';
    public const ERROR_RATE_LIMIT = 'rate_limit';
    public const ERROR_INVALID_INPUT = 'invalid_input';
    public const ERROR_AUTHENTICATION = 'authentication';
    public const ERROR_NETWORK = 'network';
    public const ERROR_FATAL = 'fatal';

    /**
     * Maximum retry attempts
     */
    private const MAX_RETRIES = 3;

    /**
     * Initial retry delay in seconds
     */
    private const INITIAL_RETRY_DELAY = 1;

    /**
     * Rate limit backoff multiplier
     */
    private const RATE_LIMIT_BACKOFF = 60;

    /**
     * User-friendly error messages
     */
    private const ERROR_MESSAGES = [
        self::ERROR_TRANSIENT => '🔄 Temporary issue. Please try again in a moment.',
        self::ERROR_RATE_LIMIT => '⏳ Too many requests. Please wait a moment.',
        self::ERROR_INVALID_INPUT => '❌ Invalid input. Please check and try again.',
        self::ERROR_AUTHENTICATION => '🔐 Authentication error. Please try logging in again.',
        self::ERROR_NETWORK => '📶 Connection issue. Please check your internet.',
        self::ERROR_FATAL => '⚠️ Something went wrong. Please contact support.',
    ];

    /**
     * Detect error type from exception
     */
    public static function detectErrorType(Throwable $e): string
    {
        $message = $e->getMessage();

        // Rate limit errors
        if (str_contains(strtolower($message), 'too many requests') ||
            str_contains(strtolower($message), 'rate limit') ||
            str_contains(strtolower($message), '429')) {
            return self::ERROR_RATE_LIMIT;
        }

        // Network errors
        if (str_contains(strtolower($message), 'connection') ||
            str_contains(strtolower($message), 'timeout') ||
            str_contains(strtolower($message), 'network')) {
            return self::ERROR_NETWORK;
        }

        // Authentication errors
        if (str_contains(strtolower($message), 'unauthorized') ||
            str_contains(strtolower($message), 'forbidden') ||
            str_contains(strtolower($message), '401') ||
            str_contains(strtolower($message), '403')) {
            return self::ERROR_AUTHENTICATION;
        }

        // Validation errors
        if (str_contains(strtolower($message), 'bad request') ||
            str_contains(strtolower($message), 'validation') ||
            str_contains(strtolower($message), '400')) {
            return self::ERROR_INVALID_INPUT;
        }

        // Transient errors (5xx)
        if (preg_match('/5\d{2}/', $message)) {
            return self::ERROR_TRANSIENT;
        }

        // Default to transient for unknown errors
        return self::ERROR_TRANSIENT;
    }

    /**
     * Get user-friendly error message
     */
    public static function getUserMessage(Throwable $e): string
    {
        $errorType = self::detectErrorType($e);
        return self::ERROR_MESSAGES[$errorType] ?? self::ERROR_MESSAGES[self::ERROR_FATAL];
    }

    /**
     * Check if error is retryable
     */
    public static function isRetryable(Throwable $e): bool
    {
        $errorType = self::detectErrorType($e);

        return in_array($errorType, [
            self::ERROR_TRANSIENT,
            self::ERROR_RATE_LIMIT,
            self::ERROR_NETWORK,
        ]);
    }

    /**
     * Get retry delay for error type
     */
    public static function getRetryDelay(Throwable $e, int $attempt): int
    {
        $errorType = self::detectErrorType($e);

        // Rate limit - use backoff
        if ($errorType === self::ERROR_RATE_LIMIT) {
            // Parse retry-after if available in Telegram error
            $message = $e->getMessage();
            if (preg_match('/retry after (\d+)/i', $message, $matches)) {
                return (int) $matches[1];
            }
            return self::RATE_LIMIT_BACKOFF;
        }

        // Exponential backoff for other transient errors
        return self::INITIAL_RETRY_DELAY * pow(2, $attempt - 1);
    }

    /**
     * Execute callback with retry logic
     */
    public static function withRetry(callable $callback, int $maxRetries = self::MAX_RETRIES): mixed
    {
        $lastException = null;

        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            try {
                return $callback();
            } catch (Throwable $e) {
                $lastException = $e;

                // Log error
                Log::warning('Telegram operation failed', [
                    'attempt' => $attempt,
                    'error' => $e->getMessage(),
                    'error_type' => self::detectErrorType($e),
                ]);

                // Check if retryable
                if (!self::isRetryable($e)) {
                    throw $e;
                }

                // Don't retry on last attempt
                if ($attempt >= $maxRetries) {
                    break;
                }

                // Wait before retry
                $delay = self::getRetryDelay($e, $attempt);
                Log::info('Retrying Telegram operation', [
                    'attempt' => $attempt,
                    'delay' => $delay,
                ]);

                sleep($delay);
            }
        }

        throw $lastException;
    }

    /**
     * Execute callback with rate limit protection
     */
    public static function withRateLimit(
        string $key,
        callable $callback,
        int $maxAttempts = 30,
        int $window = 60
    ): mixed {
        $cacheKey = "telegram_rate_limit:{$key}";

        // Get current attempt count
        $attempts = Cache::get($cacheKey, 0);

        // Check if rate limited
        if ($attempts >= $maxAttempts) {
            throw new Exception('Rate limit exceeded. Please try again later.');
        }

        // Increment attempt counter
        Cache::put($cacheKey, $attempts + 1, $window);

        try {
            return $callback();
        } catch (Throwable $e) {
            // Don't increment on success, but we already did
            // Could decrement on error if needed
            throw $e;
        }
    }

    /**
     * Log error with context
     */
    public static function logError(Throwable $e, array $context = []): void
    {
        $errorType = self::detectErrorType($e);

        $logContext = array_merge($context, [
            'error_type' => $errorType,
            'error_message' => $e->getMessage(),
            'error_code' => $e->getCode(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ]);

        if ($errorType === self::ERROR_FATAL) {
            Log::error('Telegram fatal error', $logContext);
        } else {
            Log::warning('Telegram error', $logContext);
        }
    }

    /**
     * Get error context for user
     */
    public static function getUserContext(Throwable $e): string
    {
        $errorType = self::detectErrorType($e);

        $context = '';

        switch ($errorType) {
            case self::ERROR_RATE_LIMIT:
                $delay = self::getRetryDelay($e, 1);
                $context = sprintf("\n\n⏱️ Please wait %d seconds before trying again.", $delay);
                break;

            case self::ERROR_NETWORK:
                $context = "\n\n💡 Please check your internet connection and try again.";
                break;

            case self::ERROR_AUTHENTICATION:
                $context = "\n\n🔑 Please use /start to log in again.";
                break;

            case self::ERROR_INVALID_INPUT:
                $context = "\n\n❓ Need help? Use /help for assistance.";
                break;

            case self::ERROR_FATAL:
                $context = "\n\n📞 Contact support at support@nkh.com if this persists.";
                break;
        }

        return $context;
    }

    /**
     * Format error message for Telegram
     */
    public static function formatTelegramError(Throwable $e): string
    {
        $message = self::getUserMessage($e);
        $context = self::getUserContext($e);

        return $message . $context;
    }

    /**
     * Handle webhook error
     */
    public static function handleWebhookError(Throwable $e, array $update = []): void
    {
        self::logError($e, [
            'update_id' => $update['update_id'] ?? null,
            'chat_id' => $update['message']['chat']['id'] ?? $update['callback_query']['message']['chat']['id'] ?? null,
        ]);

        // Don't send error to user on webhook - let it fail gracefully
        // The webhook should return success even on errors to avoid retries from Telegram
    }

    /**
     * Get safe text for Telegram (prevent format errors)
     */
    public static function escapeTelegramText(string $text): string
    {
        // Escape Markdown special characters
        $text = preg_replace('/([*_\[\]()~`>#+\-=|{}.!])/', '\\\\$1', $text);

        // Truncate if too long
        if (strlen($text) > 4096) {
            $text = substr($text, 0, 4093) . '...';
        }

        return $text;
    }

    /**
     * Validate callback data
     */
    public static function validateCallbackData(string $data): bool
    {
        // Max 64 bytes for callback data
        return strlen($data) <= 64 && preg_match('/^[a-zA-Z0-9_-]+$/', $data);
    }
}

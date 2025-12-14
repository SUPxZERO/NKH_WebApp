<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Input Sanitization Middleware
 * 
 * Sanitizes user input to prevent XSS, SQL injection (as secondary defense),
 * and removes potentially dangerous content.
 */
class SanitizeInput
{
    /**
     * Fields that should NOT be sanitized (e.g., passwords, rich text)
     */
    protected array $except = [
        'password',
        'password_confirmation',
        'current_password',
        'new_password',
        'content',       // Rich text content
        'description',   // May contain HTML
        'body',          // Email/message body
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $input = $request->all();
        $sanitized = $this->sanitizeArray($input);
        $request->merge($sanitized);

        return $next($request);
    }

    /**
     * Recursively sanitize an array of inputs.
     */
    protected function sanitizeArray(array $data): array
    {
        foreach ($data as $key => $value) {
            if (in_array($key, $this->except, true)) {
                continue;
            }

            if (is_array($value)) {
                $data[$key] = $this->sanitizeArray($value);
            } elseif (is_string($value)) {
                $data[$key] = $this->sanitizeString($value);
            }
        }

        return $data;
    }

    /**
     * Sanitize a string value.
     */
    protected function sanitizeString(string $value): string
    {
        // Remove null bytes
        $value = str_replace(chr(0), '', $value);

        // Trim whitespace
        $value = trim($value);

        // Remove common XSS patterns
        $value = $this->removeXssPatterns($value);

        // Optionally encode special HTML characters
        // Note: This is a defense-in-depth measure; Blade handles output encoding
        // $value = htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8', false);

        return $value;
    }

    /**
     * Remove common XSS patterns from input.
     */
    protected function removeXssPatterns(string $value): string
    {
        // Remove script tags
        $value = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $value);

        // Remove javascript: protocol
        $value = preg_replace('/javascript\s*:/i', '', $value);

        // Remove on* event handlers
        $value = preg_replace('/\s+on\w+\s*=\s*["\'][^"\']*["\']/i', '', $value);

        // Remove data: protocol in URLs (can be used for XSS)
        $value = preg_replace('/data\s*:\s*[^,]*,/i', '', $value);

        // Remove vbscript: protocol
        $value = preg_replace('/vbscript\s*:/i', '', $value);

        return $value;
    }
}

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeInput
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $input = $request->all();
        
        array_walk_recursive($input, function (&$value) {
            if (is_string($value)) {
                // Remove potentially dangerous characters
                $value = strip_tags($value);
                $value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
                
                // Remove SQL injection patterns
                $value = preg_replace('/(\s*(union|select|insert|update|delete|drop|create|alter|exec|execute)\s+)/i', '', $value);
                
                // Remove script tags and javascript
                $value = preg_replace('/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/mi', '', $value);
                $value = preg_replace('/javascript:/i', '', $value);
                $value = preg_replace('/on\w+\s*=/i', '', $value);
            }
        });
        
        $request->merge($input);
        
        return $next($request);
    }
}

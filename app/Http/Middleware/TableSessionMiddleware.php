<?php

namespace App\Http\Middleware;

use App\Models\TableSession;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * TableSessionMiddleware
 * 
 * Middleware to validate and attach table session to requests.
 * Checks for session token in:
 * - X-Table-Session header
 * - table_session cookie
 * - session_token query parameter
 */
class TableSessionMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $sessionToken = $this->getSessionToken($request);

        if ($sessionToken) {
            $session = TableSession::findByToken($sessionToken);

            if ($session) {
                // Update last activity
                $session->touch();

                // Attach session and table to request
                $request->attributes->set('table_session', $session);
                $request->attributes->set('dining_table', $session->table);

                // Also make available via request helper
                $request->merge([
                    '_table_session_id' => $session->id,
                    '_table_id' => $session->table_id,
                ]);
            }
        }

        $response = $next($request);

        // If session was created/updated, ensure cookie is set
        if ($sessionToken && isset($session)) {
            $response->withCookie(cookie(
                'table_session',
                $sessionToken,
                60 * 4, // 4 hours
                '/',
                null,
                false,
                true // httpOnly
            ));
        }

        return $response;
    }

    /**
     * Get session token from request
     */
    protected function getSessionToken(Request $request): ?string
    {
        // Priority: header > cookie > query param
        return $request->header('X-Table-Session')
            ?? $request->cookie('table_session')
            ?? $request->query('session_token');
    }
}

<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class LogSessionDebug
{
    public function handle(Request $request, Closure $next)
    {
        $cookieHeader = $request->headers->get('cookie');
        $sessionId = $request->session()->getId();
        $authId = Auth::id();
        $cookieName = config('session.cookie');
        $sessionCookie = $request->cookies->get($cookieName);
        
        Log::debug('SessionDebug', [
            'path' => $request->path(),
            'host' => $request->getHost(),
            'cookie_header' => $cookieHeader,
            'session_cookie_name' => $cookieName,
            'session_cookie_value' => $sessionCookie,
            'session_id' => $sessionId,
            'auth_id' => $authId,
            'session_domain' => config('session.domain'),
            'session_path' => config('session.path'),
        ]);
        return $next($request);
    }
}

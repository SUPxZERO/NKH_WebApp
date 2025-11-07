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
        Log::debug('SessionDebug', [
            'host' => $request->getHost(),
            'cookie' => $cookieHeader,
            'session_id' => $sessionId,
            'auth_id' => $authId,
        ]);
        return $next($request);
    }
}

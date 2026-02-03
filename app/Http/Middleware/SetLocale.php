<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Config;

class SetLocale
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Check if locale is explicitly requested in header (e.g. from axios)
        $locale = $request->header('X-Inertia-Locale');

        // 2. Fallback to Session (if set by prior request)
        if (!$locale && Session::has('locale')) {
            $locale = Session::get('locale');
        }

        // 3. Fallback to Cookie (if set by client)
        // 3. Fallback to Cookie (if set by client)
        if (!$locale) {
            $locale = $request->cookie('NEXT_LOCALE');
        }

        // 4. Fallback to Accept-Language Header
        if (!$locale) {
            $locale = $request->getPreferredLanguage(['en', 'km']);
        }

        // 5. Validate and Set
        $supportedLocales = ['en', 'km'];
        if ($locale && in_array($locale, $supportedLocales)) {
            App::setLocale($locale);
            \Carbon\Carbon::setLocale($locale);

            // Ensure session sync if not API request or if needed
            if (!Session::has('locale') || Session::get('locale') !== $locale) {
                Session::put('locale', $locale);
            }
        } else {
            // Default Fallback
            App::setLocale(Config::get('app.locale'));
            \Carbon\Carbon::setLocale(Config::get('app.locale'));
        }

        return $next($request);
    }
}

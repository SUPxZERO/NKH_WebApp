<?php

namespace App\Http\Middleware;

use App\Providers\RouteServiceProvider;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfAuthenticated
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        $guards = empty($guards) ? [null] : $guards;

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                $user = Auth::guard($guard)->user();

                // Determine where to redirect based on user role
                $isAdmin = $user && (data_get($user, 'role') === 'admin' || method_exists($user, 'hasRole') && $user->hasRole('admin'));
                $isEmployee = $user && (data_get($user, 'role') === 'employee' || method_exists($user, 'hasRole') && $user->hasRole('employee'));
                $isCustomer = $user && (data_get($user, 'role') === 'customer' || method_exists($user, 'hasRole') && $user->hasRole('customer'));

                if ($isAdmin) {
                    return redirect()->route('admin.dashboard');
                } elseif ($isEmployee) {
                    return redirect()->route('employee.pos');
                } elseif ($isCustomer) {
                    return redirect()->route('customer.dashboard');
                }else{
                    return redirect()->route('login');
                }
            }
        }

        return $next($request);
    }
}

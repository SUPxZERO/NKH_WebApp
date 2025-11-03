<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Str;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/SignIn', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $user = Auth::user();

        // Determine role from explicit attribute or from roles relationship helpers.
        $isAdmin = $user && (data_get($user, 'role') === 'admin' || method_exists($user, 'hasRole') && $user->hasRole('admin'));
        $isEmployee = $user && (data_get($user, 'role') === 'employee' || method_exists($user, 'hasRole') && $user->hasRole('employee'));

        // Preferred role-based targets
        $adminTarget = route('admin.dashboard', absolute: false);
        $employeeTarget = route('employee.pos', absolute: false);
        $customerTarget = route('customer.dashboard', absolute: false);

        // Check if there is an intended URL from the session.
        $intended = session('url.intended');

        if ($isAdmin) {
            // If intended points to admin area, honor it. Otherwise send to admin dashboard.
            if ($intended && Str::startsWith($intended, '/admin')) {
                return redirect()->to($intended);
            }

            return redirect()->to($adminTarget);
        }

        if ($isEmployee) {
            if ($intended && Str::startsWith($intended, '/employee')) {
                return redirect()->to($intended);
            }

            return redirect()->to($employeeTarget);
        }

        // Default to customer dashboard. Honor intended only if it is not an admin/employee path.
        if ($intended && ! Str::startsWith($intended, ['/admin', '/employee'])) {
            return redirect()->to($intended);
        }

        return redirect()->to($customerTarget);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}

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
        $adminRoles = ['super-admin', 'admin', 'manager', 'chief', 'service-manager', 'finance-manager', 'hr-manager', 'inventory-manager', 'operations-manager', 'viewer'];
        $employeeRoles = ['employee', 'waiter', 'chef', 'cashier', 'driver'];

        $isAdmin = false;
        $isEmployee = false;

        if ($user) {
            // Check for Admin roles (RBAC or Legacy Column)
            if (method_exists($user, 'hasAnyRole') && $user->hasAnyRole($adminRoles)) {
                $isAdmin = true;
            } elseif (in_array($user->role, $adminRoles)) {
                $isAdmin = true;
            }

            // Check for Employee roles if not admin
            if (!$isAdmin) {
                if (method_exists($user, 'hasAnyRole') && $user->hasAnyRole($employeeRoles)) {
                    $isEmployee = true;
                } elseif (in_array($user->role, $employeeRoles)) {
                    $isEmployee = true;
                }
            }
        }
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
        try {
            // Logout from web guard
            Auth::guard('web')->logout();
        } catch (\Exception $e) {
            // Ignore logout errors - user might already be logged out
        }

        try {
            // Invalidate session
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        } catch (\Exception $e) {
            // Session might already be invalid
        }

        return redirect('/');
    }
}

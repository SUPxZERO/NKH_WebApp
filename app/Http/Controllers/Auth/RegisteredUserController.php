<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        // Security: Only 'customer' role is allowed for public registration
        // Employees, Admins, and Managers must be created via admin panel
        $submittedRole = strtolower($request->input('role', 'customer'));
        
        // Log and reject any attempt to use non-customer roles
        if ($submittedRole !== 'customer') {
            \Log::warning('Role escalation attempt detected during public registration', [
                'attempted_role' => $request->role,
                'email' => $request->email,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
            
            return back()->withErrors([
                'role' => 'Only customer accounts can be created through public registration.',
            ])->withInput();
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'phone' => 'required|string|max:20',
            'terms' => 'required|accepted',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'is_active' => true,
        ]);

        $role = \App\Models\Role::where('slug', 'customer')->first();
        if ($role) {
            $user->roles()->attach($role);
        }

        \App\Models\Customer::create([
            'user_id' => $user->id,
            'customer_code' => 'CUST-' . strtoupper(\Illuminate\Support\Str::random(8)),
            'loyalty_points' => 0,
            'points_balance' => 0,
            'total_spent' => 0,
        ]);

        event(new Registered($user));

        Auth::login($user);

        return redirect()->intended(route('customer.dashboard', absolute: false));
    }
}

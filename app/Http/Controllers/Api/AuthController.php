<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Auth\RegisterRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\Customer;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone_number'] ?? null,
                // Explicitly hash password per spec (User model also has hashed cast)
                'password' => Hash::make($data['password']),
                'is_active' => true,
            ]);

            $customerRole = Role::firstOrCreate(['slug' => 'customer'], ['name' => 'Customer']);
            $user->roles()->syncWithoutDetaching([$customerRole->id]);

            Customer::firstOrCreate(['user_id' => $user->id]);

            return $user;
        });

        // Create access token (expires per sanctum config, default 60 min)
        $accessToken = $user->createToken('api', ['*'])->plainTextToken;
        
        // Create refresh token (7 day expiry)
        $refreshToken = $user->createToken('refresh', ['refresh'], now()->addDays(7))->plainTextToken;

        return response()->json([
            'message' => 'Registration successful.',
            'user' => (new UserResource($user->load('roles')))->resolve(request()),
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'expires_in' => config('sanctum.expiration', 60) * 60,
            'token' => $accessToken, // backwards compatibility
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        if (! Auth::attempt(['email' => $credentials['email'], 'password' => $credentials['password']])) {
            // Record failed attempt for lockout tracking
            \App\Http\Middleware\AccountLockout::recordFailedAttempt($credentials['email']);
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        /** @var User $user */
        $user = Auth::user();
        
        // Clear lockout counters on successful login
        \App\Http\Middleware\AccountLockout::clearAttempts($user);
        
        // Create access token (expires per sanctum config, default 60 min)
        $accessToken = $user->createToken('api', ['*'])->plainTextToken;
        
        // Create refresh token (7 day expiry)
        $refreshToken = $user->createToken('refresh', ['refresh'], now()->addDays(7))->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'user' => (new UserResource($user->load('roles')))->resolve(request()),
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'expires_in' => config('sanctum.expiration', 60) * 60, // seconds
            'token' => $accessToken, // backwards compatibility
        ]);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user()->load('roles'));
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }
        return response()->json(['message' => 'Successfully logged out.']);
    }
}

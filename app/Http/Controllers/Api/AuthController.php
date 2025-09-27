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

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful.',
            'user' => (new UserResource($user->load('roles')))->resolve(request()),
            'token' => $token,
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        if (! Auth::attempt(['email' => $credentials['email'], 'password' => $credentials['password']])) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        /** @var User $user */
        $user = Auth::user();
        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'user' => (new UserResource($user->load('roles')))->resolve(request()),
            'token' => $token,
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

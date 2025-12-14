<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class RefreshTokenController extends Controller
{
    /**
     * Refresh the access token using a valid refresh token.
     * 
     * The refresh token should be passed in the Authorization header.
     * Returns a new access token while invalidating the old one.
     */
    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Get the current token
        $currentToken = $user->currentAccessToken();
        
        // Check if this is a refresh token (has 'refresh' ability)
        if ($currentToken && !$currentToken->can('refresh')) {
            return response()->json([
                'message' => 'Cannot refresh using an access token. Use a refresh token.',
            ], 403);
        }

        // Delete the current access tokens (exclude refresh tokens)
        $user->tokens()
            ->where('name', 'api')
            ->delete();

        // Create new access token (60 min expiry controlled by config)
        $accessToken = $user->createToken('api', ['*'])->plainTextToken;

        // Create new refresh token (7 day expiry)
        $refreshToken = $user->createToken('refresh', ['refresh'], now()->addDays(7))->plainTextToken;

        return response()->json([
            'message' => 'Token refreshed successfully.',
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'expires_in' => config('sanctum.expiration', 60) * 60, // seconds
        ]);
    }

    /**
     * Revoke all tokens for the current user.
     */
    public function revokeAll(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $user->tokens()->delete();

        return response()->json([
            'message' => 'All tokens revoked successfully.',
        ]);
    }
}

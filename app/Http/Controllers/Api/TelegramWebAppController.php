<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TelegramUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Controller for Telegram WebApp session initialization
 * 
 * This endpoint is called by the frontend when it detects it's running
 * inside a Telegram WebApp. It validates the initData and establishes
 * a session that allows the user to access customer pages.
 */
class TelegramWebAppController extends Controller
{
    /**
     * Initialize/validate Telegram WebApp session
     * 
     * POST /api/telegram-webapp/init
     * Body: { initData: string, user_id?: number }
     */
    public function init(Request $request): JsonResponse
    {
        $initData = $request->input('initData');
        $directUserId = $request->input('user_id');

        // Try to validate initData if provided
        if ($initData) {
            $userData = $this->validateAndParseInitData($initData);
            if ($userData && isset($userData['id'])) {
                return $this->establishSession($userData['id'], $userData);
            }
        }

        // Fallback to direct user_id (less secure, for development)
        if ($directUserId) {
            return $this->establishSession((int) $directUserId, null);
        }

        return response()->json([
            'success' => false,
            'error' => 'Invalid Telegram data',
        ], 400);
    }

    /**
     * Check current Telegram session status
     * 
     * GET /api/telegram-webapp/status
     */
    public function status(Request $request): JsonResponse
    {
        $isTelegramGuest = session('telegram_guest') === true;
        $telegramUserId = session('telegram_user_id');
        $telegramUser = session('telegram_user');

        return response()->json([
            'success' => true,
            'data' => [
                'is_telegram_guest' => $isTelegramGuest,
                'telegram_user_id' => $telegramUserId,
                'telegram_user' => $telegramUser,
                'is_authenticated' => auth()->check(),
                'user' => auth()->user() ? [
                    'id' => auth()->user()->id,
                    'name' => auth()->user()->name,
                ] : null,
            ],
        ]);
    }

    /**
     * Establish session for Telegram user
     */
    private function establishSession(int $telegramId, ?array $userData): JsonResponse
    {
        // SPRINT P16: Use findOrCreate to ensure Customer record is auto-created
        // This ensures consistency with webhook handler and guarantees full customer features
        if ($userData) {
            $telegramUser = TelegramUser::findOrCreate($userData);
        } else {
            // Fallback: if no userData provided, create minimal array with just ID
            $telegramUser = TelegramUser::findOrCreate(['id' => $telegramId]);
        }

        if (!$telegramUser) {
            return response()->json([
                'success' => false,
                'error' => 'Telegram user not found',
            ], 404);
        }

        if (!$telegramUser->is_active) {
            return response()->json([
                'success' => false,
                'error' => 'Telegram user is inactive',
            ], 403);
        }

        // If telegram user has a linked customer account, log them in
        if ($telegramUser->customer_id && $telegramUser->customer?->user) {
            auth()->login($telegramUser->customer->user);
            
            return response()->json([
                'success' => true,
                'message' => 'Authenticated with linked account',
                'data' => [
                    'is_guest' => false,
                    'user_id' => $telegramUser->customer->user->id,
                    'telegram_user_id' => $telegramUser->id,
                    'name' => $telegramUser->customer->user->name,
                ],
            ]);
        }

        // Establish guest session
        session([
            'telegram_guest' => true,
            'telegram_user_id' => $telegramId,
            'telegram_webapp' => true,
            'telegram_user' => [
                'id' => $telegramUser->id,
                'telegram_id' => $telegramUser->telegram_id,
                'first_name' => $telegramUser->first_name,
                'last_name' => $telegramUser->last_name,
                'username' => $telegramUser->telegram_username,
                'display_name' => $telegramUser->display_name,
                'customer_id' => $telegramUser->customer_id, // Ensure customer_id is in session
            ],
        ]);

        Log::info('TelegramWebApp: Guest session established', [
            'telegram_id' => $telegramId,
            'telegram_user_id' => $telegramUser->id,
            'customer_id' => $telegramUser->customer_id,
        ]);

        // SPRINT P16 FIX: Return a full "User" object structure that
        // the Frontend AuthProvider can understand and accept.
        // This mocks a logged-in user based on the valid Telegram session.
        $customer = $telegramUser->customer;
        $mockUser = [
            'id' => 990000000 + $telegramUser->id, // Pseudo ID to avoid conflict with real users
            'name' => $telegramUser->display_name,
            'email' => $customer?->email ?? "telegram_{$telegramUser->telegram_id}@nkh.local",
            'role' => 'customer',
            'phone' => $telegramUser->phone_number,
            'avatar' => $customer && $customer->avatar ? \Illuminate\Support\Facades\Storage::url($customer->avatar) : null,
            'created_at' => $telegramUser->created_at->toISOString(),
            'updated_at' => $telegramUser->updated_at->toISOString(),
            'is_telegram_user' => true, // Flag for frontend to know source
            'telegram_user_id' => $telegramUser->id,
            'customer_id' => $telegramUser->customer_id,
        ];

        return response()->json([
            'success' => true,
            'message' => 'Guest session established',
            'data' => [
                'is_guest' => true,
                'telegram_user_id' => $telegramUser->id,
                'name' => $telegramUser->display_name,
                'user' => $mockUser, // The full user object for AuthProvider
            ],
        ]);
    }


    /**
     * Validate Telegram WebApp initData using HMAC-SHA256
     */
    private function validateAndParseInitData(string $initData): ?array
    {
        $botToken = config('telegram.bot_token');
        if (!$botToken) {
            Log::warning('TelegramWebApp: Bot token not configured');
            return null;
        }

        try {
            // Parse the initData
            parse_str($initData, $data);
            
            if (!isset($data['hash'])) {
                return null;
            }

            $checkHash = $data['hash'];
            unset($data['hash']);

            // Sort alphabetically
            ksort($data);

            // Create data-check-string
            $dataCheckString = '';
            foreach ($data as $key => $value) {
                $dataCheckString .= "{$key}={$value}\n";
            }
            $dataCheckString = rtrim($dataCheckString, "\n");

            // Calculate secret key
            $secretKey = hash_hmac('sha256', $botToken, 'WebAppData', true);
            
            // Calculate hash
            $hash = bin2hex(hash_hmac('sha256', $dataCheckString, $secretKey, true));

            // Verify hash
            if (hash_equals($hash, $checkHash)) {
                // Parse user data from initData
                if (isset($data['user'])) {
                    return json_decode($data['user'], true);
                }
            }

            return null;
        } catch (\Exception $e) {
            Log::error('TelegramWebApp: Validation error', ['error' => $e->getMessage()]);
            return null;
        }
    }
}

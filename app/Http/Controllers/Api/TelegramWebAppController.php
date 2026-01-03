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
        // Find or create TelegramUser
        $telegramUser = TelegramUser::where('telegram_id', $telegramId)->first();
        
        if (!$telegramUser && $userData) {
            // Auto-create TelegramUser if it doesn't exist
            $telegramUser = TelegramUser::create([
                'telegram_id' => $telegramId,
                'first_name' => $userData['first_name'] ?? 'Guest',
                'last_name' => $userData['last_name'] ?? null,
                'telegram_username' => $userData['username'] ?? null,
                'is_active' => true,
            ]);
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
            ],
        ]);

        Log::info('TelegramWebApp: Guest session established', [
            'telegram_id' => $telegramId,
            'telegram_user_id' => $telegramUser->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Guest session established',
            'data' => [
                'is_guest' => true,
                'telegram_user_id' => $telegramUser->id,
                'name' => $telegramUser->display_name,
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

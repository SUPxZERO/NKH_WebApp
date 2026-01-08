<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Models\UserProfile;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class TelegramWebAppAuth
{
    /**
     * Handle an incoming request - Phase 3 unified identity version.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        $initData = $request->header('X-Telegram-Init-Data');
        
        if (!$initData) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Telegram authentication required'
            ], 401);
        }

        try {
            // Parse Telegram init data
            $parsedData = $this->parseInitData($initData);
            
            if (!$parsedData || !isset($parsedData['id'])) {
                throw new \Exception('Invalid Telegram data');
            }

            // Phase 3: Find or create user by telegram_id
            $user = User::byTelegram($parsedData['id'])->first();
            
            if (!$user) {
                // Create new user from Telegram data
                $user = User::create([
                    'telegram_id' => $parsedData['id'],
                    'name' => trim(($parsedData['first_name'] ?? '') . ' ' . ($parsedData['last_name'] ?? '')),
                    'phone' => $parsedData['phone_number'] ?? null,
                    'avatar_url' => $parsedData['photo_url'] ?? null,
                    'role' => 'customer',
                    'password' => null, // Telegram-only auth
                    'is_active' => true,
                ]);

                // Create user profile
                UserProfile::create([
                    'user_id' => $user->id,
                    'customer_code' => UserProfile::generateCustomerCode(),
                    'preferred_language' => $parsedData['language_code'] ?? 'en',
                    'points_balance' => 0,
                    'customer_tier' => 'bronze',
                ]);

                Log::info('Phase 3: Created new user from Telegram', [
                    'user_id' => $user->id,
                    'telegram_id' => $user->telegram_id,
                ]);
            } else {
                // Update last login
                $user->update(['last_login_at' => now()]);
                
                // Ensure profile exists
                if (!$user->profile) {
                    UserProfile::create([
                        'user_id' => $user->id,
                        'customer_code' => UserProfile::generateCustomerCode(),
                        'preferred_language' => $parsedData['language_code'] ?? 'en',
                        'points_balance' => 0,
                        'customer_tier' => 'bronze',
                    ]);
                }
            }

            // Authenticate the user
            Auth::login($user);
            
            // Store Telegram data in request for downstream use
            $request->merge(['telegram_user' => $parsedData]);

            return $next($request);

        } catch (\Exception $e) {
            Log::error('Telegram authentication failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Authentication failed',
                'message' => config('app.debug') ? $e->getMessage() : 'Invalid authentication data'
            ], 401);
        }
    }

    /**
     * Parse Telegram WebApp init data.
     */
    protected function parseInitData(string $initData): ?array
    {
        parse_str($initData, $data);
        
        // In production, verify hash here
        // For now, basic parsing
        
        if (isset($data['user'])) {
            return json_decode($data['user'], true);
        }
        
        return null;
    }
}

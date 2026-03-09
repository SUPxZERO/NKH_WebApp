<?php

namespace App\Http\Middleware;

use App\Models\TelegramUser;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TelegramAuth
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get telegram user ID from header
        $telegramId = $request->header('X-Telegram-User-ID');

        if (!$telegramId) {
            return response()->json([
                'success' => false,
                'error' => 'Telegram user ID required',
            ], 401);
        }

        // Find the Telegram user
        $telegramUser = TelegramUser::findByTelegramId((int) $telegramId);

        if (!$telegramUser) {
            return response()->json([
                'success' => false,
                'error' => 'Telegram user not found',
            ], 401);
        }

        if (!$telegramUser->is_active) {
            return response()->json([
                'success' => false,
                'error' => 'Account is disabled',
            ], 403);
        }

        // SPRINT P16: Ensure Telegram user has an associated Customer record
        if (!$telegramUser->customer_id) {
            $customerService = app(\App\Services\Telegram\TelegramCustomerService::class);
            $customerService->createForTelegramUser($telegramUser);
            // Refresh to get the attached customer
            $telegramUser->refresh();
        }

        // Set the user on the request forControllers to use
        $request->setUserResolver(function () use ($telegramUser) {
            return $telegramUser;
        });

        return $next($request);
    }
}

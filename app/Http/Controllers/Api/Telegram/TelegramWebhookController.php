<?php

namespace App\Http\Controllers\Api\Telegram;

use App\Http\Controllers\Controller;
use App\Models\TelegramUser;
use App\Services\Telegram\TelegramBotService;
use App\Services\Telegram\TelegramErrorHandler;
use App\Services\Telegram\TelegramKeyboardBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class TelegramWebhookController extends Controller
{
    private TelegramBotService $botService;

    public function __construct(TelegramBotService $botService)
    {
        $this->botService = $botService;
    }

    /**
     * Handle incoming Telegram webhook
     */
    public function handle(Request $request): JsonResponse
    {
        $successResponse = response()->json(['ok' => true]);

        try {
            // Verify secret token
            $secretToken = $request->header('X-Telegram-Bot-Api-Secret-Token');
            if (!$this->botService->verifySecretToken($secretToken)) {
                Log::warning('Telegram webhook: Invalid secret token');
                return response()->json(['ok' => false, 'error' => 'Invalid secret token'], 403);
            }

            $update = $request->all();
            if (!isset($update['update_id'])) {
                return $successResponse;
            }

            Log::debug('Telegram webhook received', ['update_id' => $update['update_id']]);

            if (isset($update['message'])) {
                $this->handleMessage($update['message']);
            } elseif (isset($update['callback_query'])) {
                $this->handleCallbackQuery($update['callback_query']);
            }

            return $successResponse;
        } catch (Throwable $e) {
            TelegramErrorHandler::handleWebhookError($e, $request->all());
            return $successResponse;
        }
    }

    /**
     * Handle regular messages
     */
    private function handleMessage(array $message): void
    {
        try {
            $chatId = $message['chat']['id'] ?? null;
            $text = $message['text'] ?? '';
            
            if (!$chatId) return;

            // Get or create user
            $user = $this->botService->findOrCreateUser($message);
            $this->botService->updateUserInteraction($user);

            // Only handle /start command
            if (trim($text) === '/start') {
                $this->cmdStart($user, $chatId);
            } else {
                // Determine if we should reply to other text or just ignore
                // For now, let's just ignore or maybe send a hint if it looks like a command
                if (str_starts_with($text, '/')) {
                     $this->botService->sendMessage($chatId, "Please use /start to begin.");
                }
            }
        } catch (Throwable $e) {
            TelegramErrorHandler::logError($e, ['method' => 'handleMessage']);
        }
    }

    /**
     * Handle callback queries
     */
    private function handleCallbackQuery(array $callbackQuery): void
    {
        try {
            $chatId = $callbackQuery['message']['chat']['id'] ?? null;
            $data = $callbackQuery['data'] ?? '';

            if (!$chatId) return;

            $user = $this->botService->findOrCreateUser($callbackQuery);
            $this->botService->updateUserInteraction($user);
            $this->botService->answerCallbackQuery($callbackQuery['id']);

            if ($data === 'help_info') {
                $this->cmdHelp($chatId);
            } elseif ($data === 'check_status') {
                 $this->botService->sendMessage($chatId, "You will receive notifications here automatically when your order status changes.");
            }
        } catch (Throwable $e) {
            TelegramErrorHandler::logError($e, ['method' => 'handleCallbackQuery']);
        }
    }

    /**
     * Start Command - Welcome Message
     */
    private function cmdStart(TelegramUser $user, int $chatId): void
    {
        $message = "🎉 *Welcome to NKH Restaurant!*\n";
        $message .= "━━━━━━━━━━━━━━━━━━━━━\n\n";
        $message .= "🍽️ *Delicious food, delivered to you!*\n\n";
        $message .= "Click *Order Now* to browse our full menu and place your order directly through our website app.\n\n";
        $message .= "Need help? Click Help below.";

        $keyboard = TelegramKeyboardBuilder::mainMenu();

        $this->botService->sendInlineKeyboard($chatId, $message, $keyboard);
    }

    /**
     * Help Command - Location & Contact
     */
    private function cmdHelp(int $chatId): void
    {
        $locations = \App\Models\Location::active()->get();
        
        $message = "🆘 *Help & Support*\n\n";
        $message .= "📍 *Our Locations*\n";
        
        foreach ($locations as $location) {
            $address = trim(($location->address_line1 ?? '') . ($location->address_line2 ? ', ' . $location->address_line2 : ''));
            $message .= "• *{$location->name}*: {$address}\n";
            $message .= "  📞 {$location->phone}\n";
        }
        
        $message .= "\n📧 *Email*: support@nkh-restaurant.com\n";
        $message .= "🕒 *Hours*: 10:00 AM - 10:00 PM Daily";

        $this->botService->sendMessage($chatId, $message);
    }
}

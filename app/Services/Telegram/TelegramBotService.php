<?php

namespace App\Services\Telegram;

use App\Models\TelegramUser;
use App\Models\TelegramOrderNotification;
use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class TelegramBotService
{
    /**
     * Telegram Bot API base URL
     */
    private const API_BASE = 'https://api.telegram.org/bot';

    /**
     * Bot token from environment
     */
    private string $token;

    /**
     * Webhook secret token for verification
     */
    private string $secretToken;

    /**
     * Current API URL for this request
     */
    private string $apiUrl;

    public function __construct()
    {
        $this->token = config('telegram.bot_token', env('TELEGRAM_BOT_TOKEN', ''));
        $this->secretToken = config('telegram.secret_token', env('TELEGRAM_SECRET_TOKEN', ''));
        $this->apiUrl = self::API_BASE . $this->token;
    }

    /**
     * Verify the webhook secret token
     */
    public function verifySecretToken(?string $secretToken): bool
    {
        if (empty($this->secretToken)) {
            return true; // No secret configured, skip verification
        }

        return $secretToken === $this->secretToken;
    }

    /**
     * Get bot info
     */
    public function getBotInfo(): ?array
    {
        try {
            $response = Http::get($this->apiUrl . '/getMe');

            if ($response->successful()) {
                return $response->json('result');
            }

            Log::error('Telegram getMe failed', ['response' => $response->json()]);
            return null;
        } catch (Throwable $e) {
            Log::error('Telegram getMe error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Send a text message with retry logic
     */
    public function sendMessage(
        int $chatId,
        string $text,
        ?int $replyToMessageId = null,
        ?array $replyMarkup = null,
        ?string $parseMode = 'Markdown',
        bool $withRetry = true
    ): ?array {
        $sendOperation = function () use ($chatId, $text, $replyToMessageId, $replyMarkup, $parseMode) {
            $payload = [
                'chat_id' => $chatId,
                'text' => TelegramErrorHandler::escapeTelegramText($text),
                'parse_mode' => $parseMode,
            ];

            if ($replyToMessageId) {
                $payload['reply_to_message_id'] = $replyToMessageId;
            }

            if ($replyMarkup) {
                $payload['reply_markup'] = json_encode($replyMarkup);
            }

            $response = Http::timeout(10)->post($this->apiUrl . '/sendMessage', $payload);

            if (!$response->successful()) {
                throw new \Exception('Telegram API error: ' . json_encode($response->json()));
            }

            Log::debug('Telegram message sent', ['chat_id' => $chatId]);
            return $response->json('result');
        };

        try {
            if ($withRetry) {
                return TelegramErrorHandler::withRetry($sendOperation);
            }
            return $sendOperation();
        } catch (Throwable $e) {
            TelegramErrorHandler::logError($e, ['chat_id' => $chatId, 'operation' => 'sendMessage']);
            return null;
        }
    }

    /**
     * Send a message with inline keyboard
     */
    public function sendInlineKeyboard(
        int $chatId,
        string $text,
        array $buttons,
        ?string $parseMode = 'Markdown'
    ): ?array {
        $keyboard = [
            'inline_keyboard' => array_map(fn($row) => array_map(fn($btn) => [
                'text' => $btn['text'],
                'callback_data' => $btn['callback_data'] ?? $btn['url'] ?? '',
            ], $row), $buttons),
        ];

        return $this->sendMessage($chatId, $text, null, $keyboard, $parseMode);
    }

    /**
     * Send a message with reply keyboard (persistent)
     */
    public function sendReplyKeyboard(
        int $chatId,
        string $text,
        array $buttons,
        ?string $parseMode = 'Markdown'
    ): ?array {
        $keyboard = [
            'keyboard' => array_map(fn($row) => array_map(fn($btn) => [
                'text' => $btn['text'],
                'request_contact' => $btn['request_contact'] ?? false,
            ], $row), $buttons),
            'resize_keyboard' => true,
            'one_time_keyboard' => false,
        ];

        return $this->sendMessage($chatId, $text, null, $keyboard, $parseMode);
    }

    /**
     * Edit an existing message
     */
    public function editMessage(
        int $chatId,
        int $messageId,
        string $text,
        ?array $replyMarkup = null
    ): ?array {
        try {
            $payload = [
                'chat_id' => $chatId,
                'message_id' => $messageId,
                'text' => $text,
                'parse_mode' => 'Markdown',
            ];

            if ($replyMarkup) {
                $payload['reply_markup'] = json_encode($replyMarkup);
            }

            $response = Http::post($this->apiUrl . '/editMessageText', $payload);

            if ($response->successful()) {
                return $response->json('result');
            }

            Log::error('Telegram editMessage failed', ['response' => $response->json()]);
            return null;
        } catch (Throwable $e) {
            Log::error('Telegram editMessage error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Delete a message
     */
    public function deleteMessage(int $chatId, int $messageId): bool
    {
        try {
            $response = Http::post($this->apiUrl . '/deleteMessage', [
                'chat_id' => $chatId,
                'message_id' => $messageId,
            ]);

            return $response->successful();
        } catch (Throwable $e) {
            Log::error('Telegram deleteMessage error', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Answer callback query (for inline button clicks)
     */
    public function answerCallbackQuery(
        string $callbackId,
        ?string $text = null,
        ?bool $showAlert = false
    ): bool {
        try {
            $payload = [
                'callback_query_id' => $callbackId,
                'show_alert' => $showAlert,
            ];

            if ($text) {
                $payload['text'] = $text;
            }

            $response = Http::post($this->apiUrl . '/answerCallbackQuery', $payload);

            return $response->successful();
        } catch (Throwable $e) {
            Log::error('Telegram answerCallbackQuery error', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Send photo
     */
    public function sendPhoto(
        int $chatId,
        string $photoUrl,
        ?string $caption = null,
        ?int $replyToMessageId = null
    ): ?array {
        try {
            $payload = [
                'chat_id' => $chatId,
                'photo' => $photoUrl,
            ];

            if ($caption) {
                $payload['caption'] = $caption;
                $payload['parse_mode'] = 'Markdown';
            }

            if ($replyToMessageId) {
                $payload['reply_to_message_id'] = $replyToMessageId;
            }

            $response = Http::post($this->apiUrl . '/sendPhoto', $payload);

            if ($response->successful()) {
                return $response->json('result');
            }

            return null;
        } catch (Throwable $e) {
            Log::error('Telegram sendPhoto error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Send order notification to user
     */
    public function sendOrderNotification(
        TelegramUser $telegramUser,
        Order $order,
        string $status,
        ?string $customMessage = null
    ): bool {
        if (!$telegramUser->notifications_enabled || !$telegramUser->is_active) {
            return false;
        }

        $message = $this->formatOrderStatusMessage($order, $status, $customMessage);

        $result = $this->sendMessage($telegramUser->telegram_id, $message);

        if ($result) {
            // Log the notification
            TelegramOrderNotification::create([
                'order_id' => $order->id,
                'telegram_user_id' => $telegramUser->id,
                'status' => $status,
                'message' => $message,
                'sent' => true,
                'sent_at' => now(),
            ]);

            return true;
        }

        // Log failed notification
        TelegramOrderNotification::create([
            'order_id' => $order->id,
            'telegram_user_id' => $telegramUser->id,
            'status' => $status,
            'message' => $message,
            'sent' => false,
        ]);

        return false;
    }

    /**
     * Format order status message
     */
    public function formatOrderStatusMessage(
        Order $order,
        string $status,
        ?string $customMessage = null
    ): string {
        $orderNumber = $order->order_number ?? "#{$order->id}";

        $templates = [
            'placed' => "🎉 *Order Confirmed!*\n\nYour order `{$orderNumber}` has been received and is being reviewed.",
            'approved' => "✅ *Order Approved!*\n\nGreat news! Your order `{$orderNumber}` has been approved and will be prepared shortly.",
            'rejected' => "❌ *Order Declined*\n\nWe're sorry, your order `{$orderNumber}` could not be processed.",
            'preparing' => "👨‍🍳 *Preparing Your Order*\n\nYour order `{$orderNumber}` is now being prepared in our kitchen.",
            'ready' => "🔔 *Order Ready!*\n\nYour order `{$orderNumber}` is ready for pickup!",
            'out_for_delivery' => "🚗 *On The Way!*\n\nYour order `{$orderNumber}` is out for delivery.",
            'delivered' => "📦 *Delivered!*\n\nYour order `{$orderNumber}` has been delivered. Enjoy your meal!",
            'completed' => "⭐ *Order Complete*\n\nThank you for your order `{$orderNumber}`! We hope you enjoyed it.",
            'cancelled' => "🚫 *Order Cancelled*\n\nYour order `{$orderNumber}` has been cancelled.",
        ];

        $message = $templates[$status] ?? "📋 Order `{$orderNumber}` status: {$status}";

        if ($customMessage) {
            $message .= "\n\n_{$customMessage}_";
        }

        // Add order details
        $message .= $this->formatOrderDetails($order);

        return $message;
    }

    /**
     * Format order details for messages
     */
    public function formatOrderDetails(Order $order): string
    {
        $details = "\n\n─────────────────────";

        // Order type and location
        if ($order->order_type === 'delivery') {
            $details .= "\n📍 Delivery to your address";
        } else {
            $details .= "\n📍 Pickup at: " . ($order->location?->name ?? 'Main Branch');
        }

        // Time
        if ($order->pickup_time) {
            $details .= "\n🕐 Time: " . $order->pickup_time->format('M j, g:i A');
        }

        // Amount
        $details .= "\n💵 Total: $" . number_format($order->total_amount, 2);

        // Payment status
        if ($order->payment_status === 'paid') {
            $details .= " (Paid)";
        } elseif ($order->payment_mode === 'pay_on_pickup' || $order->payment_mode === 'pay_on_delivery') {
            $details .= " (Pay on " . ($order->order_type === 'delivery' ? 'Delivery' : 'Pickup') . ")";
        }

        return $details;
    }

    /**
     * Find or create Telegram user from update
     */
    public function findOrCreateUser(array $update): TelegramUser
    {
        $message = $update['message'] ?? $update['callback_query'] ?? [];
        $from = $message['from'] ?? [];

        return TelegramUser::findOrCreate($from);
    }

    /**
     * Update user interaction timestamp
     */
    public function updateUserInteraction(TelegramUser $user): void
    {
        $user->update(['last_interaction_at' => now()]);
    }

    /**
     * Set webhook URL
     */
    public function setWebhook(string $url): bool
    {
        try {
            $response = Http::post($this->apiUrl . '/setWebhook', [
                'url' => $url,
                'secret_token' => $this->secretToken,
            ]);

            if ($response->successful()) {
                Log::info('Telegram webhook set', ['url' => $url]);
                return true;
            }

            Log::error('Telegram setWebhook failed', ['response' => $response->json()]);
            return false;
        } catch (Throwable $e) {
            Log::error('Telegram setWebhook error', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Delete webhook
     */
    public function deleteWebhook(): bool
    {
        try {
            $response = Http::post($this->apiUrl . '/deleteWebhook');

            if ($response->successful()) {
                Log::info('Telegram webhook deleted');
                return true;
            }

            return false;
        } catch (Throwable $e) {
            Log::error('Telegram deleteWebhook error', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Get webhook info
     */
    public function getWebhookInfo(): ?array
    {
        try {
            $response = Http::get($this->apiUrl . '/getWebhookInfo');

            if ($response->successful()) {
                return $response->json('result');
            }

            return null;
        } catch (Throwable $e) {
            Log::error('Telegram getWebhookInfo error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Handle Telegram API errors
     */
    public function handleApiError(array $response): ?string
    {
        if (isset($response['ok']) && $response['ok'] === false) {
            $error = $response['description'] ?? 'Unknown error';

            Log::warning('Telegram API error', ['error' => $error]);

            return $error;
        }

        return null;
    }

    /**
     * Escape Markdown special characters
     */
    public static function escapeMarkdown(string $text): string
    {
        return preg_replace('/([_*\[\]()~`>#+\-=|{}.!])/', '\\$1', $text);
    }
}

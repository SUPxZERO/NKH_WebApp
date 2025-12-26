<?php

namespace App\Jobs;

use App\Models\TelegramOrderNotification;
use App\Models\TelegramUser;
use App\Services\Telegram\TelegramBotService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Queue job to retry failed Telegram notifications
 */
class TelegramNotificationRetryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Maximum number of retry attempts
     */
    public int $tries = 5;

    /**
     * Number of seconds before job will be retried
     */
    public int $backoff = [30, 60, 180, 300, 600];

    /**
     * The Telegram notification instance
     */
    public TelegramOrderNotification $notification;

    /**
     * Create a new job instance
     */
    public function __construct(TelegramOrderNotification $notification)
    {
        $this->notification = $notification;
    }

    /**
     * Execute job
     */
    public function handle(TelegramBotService $botService): void
    {
        $notification = $this->notification;

        // Skip if already sent
        if ($notification->sent) {
            Log::info('Telegram notification already sent, skipping retry', [
                'notification_id' => $notification->id,
            ]);
            return;
        }

        // Skip if max retries exceeded
        if ($notification->retry_count >= $this->tries) {
            Log::error('Telegram notification max retries exceeded', [
                'notification_id' => $notification->id,
                'retry_count' => $notification->retry_count,
            ]);

            $notification->update([
                'failed' => true,
                'error_message' => 'Max retries exceeded',
            ]);

            return;
        }

        $telegramUser = $notification->telegramUser;

        // Check if user is still active
        if (!$telegramUser || !$telegramUser->is_active) {
            Log::info('Telegram user inactive, skipping notification', [
                'telegram_user_id' => $notification->telegram_user_id,
            ]);

            $notification->update([
                'failed' => true,
                'error_message' => 'User inactive',
            ]);

            return;
        }

        // Check if user has notifications enabled
        if (!$telegramUser->notifications_enabled) {
            Log::info('Telegram notifications disabled for user, skipping', [
                'telegram_user_id' => $notification->telegram_user_id,
            ]);

            $notification->update([
                'failed' => true,
                'error_message' => 'Notifications disabled',
            ]);

            return;
        }

        try {
            // Send notification
            $result = $botService->sendMessage(
                $telegramUser->telegram_id,
                $notification->message
            );

            if ($result) {
                // Success
                $notification->update([
                    'sent' => true,
                    'sent_at' => now(),
                    'retry_count' => $notification->retry_count + 1,
                ]);

                Log::info('Telegram notification sent successfully (retry)', [
                    'notification_id' => $notification->id,
                    'attempt' => $notification->retry_count + 1,
                ]);
            } else {
                // Failed but may retry
                $this->retryOrFail($notification, 'Failed to send message');
            }
        } catch (Throwable $e) {
            $this->retryOrFail($notification, $e->getMessage(), $e);
        }
    }

    /**
     * Mark notification for retry or fail it
     */
    private function retryOrFail(
        TelegramOrderNotification $notification,
        string $errorMessage,
        ?Throwable $exception = null
    ): void {
        $retryCount = $notification->retry_count + 1;

        if ($exception) {
            Log::warning('Telegram notification failed, will retry', [
                'notification_id' => $notification->id,
                'attempt' => $retryCount,
                'error' => $errorMessage,
            ]);
        }

        $notification->update([
            'retry_count' => $retryCount,
            'last_retry_at' => now(),
            'error_message' => $errorMessage,
        ]);

        // Check if we should retry
        if ($retryCount < $this->tries) {
            // Release job to queue with backoff
            $this->release($this->backoff[$retryCount - 1] ?? 600);
        } else {
            // Max retries reached
            $notification->update([
                'failed' => true,
                'error_message' => 'Max retries exceeded: ' . $errorMessage,
            ]);

            Log::error('Telegram notification failed permanently', [
                'notification_id' => $notification->id,
                'attempts' => $retryCount,
                'error' => $errorMessage,
            ]);
        }
    }

    /**
     * Handle a job failure
     */
    public function failed(Throwable $exception): void
    {
        Log::error('TelegramNotificationRetryJob failed', [
            'notification_id' => $this->notification->id,
            'error' => $exception->getMessage(),
        ]);

        // Mark notification as permanently failed
        $this->notification->update([
            'failed' => true,
            'error_message' => 'Job failed: ' . $exception->getMessage(),
        ]);
    }

    /**
     * Get tags that should be assigned to job
     */
    public function tags(): array
    {
        return [
            'telegram',
            'notification',
            'telegram_notification:' . $this->notification->id,
            'order:' . $this->notification->order_id,
        ];
    }
}

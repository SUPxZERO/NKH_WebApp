<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Queued job for sending order notifications asynchronously.
 * 
 * This improves order placement response time by offloading
 * notification delivery (Telegram, Email, Push) to the queue worker.
 */
class SendOrderNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying.
     */
    public int $backoff = 10;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Order $order,
        public string $event,
        public ?string $customMessage = null
    ) {}

    /**
     * Execute the job.
     */
    public function handle(NotificationService $notificationService): void
    {
        try {
            Log::info("📤 Processing queued order notification", [
                'order_id' => $this->order->id,
                'event' => $this->event,
            ]);

            $notificationService->sendOrderNotification(
                $this->order,
                $this->event,
                $this->customMessage
            );

            Log::info("✅ Order notification sent successfully", [
                'order_id' => $this->order->id,
                'event' => $this->event,
            ]);
        } catch (\Exception $e) {
            Log::error("❌ Failed to send order notification", [
                'order_id' => $this->order->id,
                'event' => $this->event,
                'error' => $e->getMessage(),
            ]);
            
            throw $e; // Re-throw to trigger retry
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("🔴 Order notification job failed permanently", [
            'order_id' => $this->order->id,
            'event' => $this->event,
            'error' => $exception->getMessage(),
        ]);
    }
}

<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderStatusChanged extends Notification implements ShouldQueue
{
    use Queueable;

    private Order $order;
    private string $status;
    private ?string $rejectionReason;

    public function __construct(Order $order, string $status, ?string $rejectionReason = null)
    {
        $this->order = $order;
        $this->status = $status;
        $this->rejectionReason = $rejectionReason;
    }

    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable): MailMessage
    {
        $message = (new MailMessage)
            ->subject("Order {$this->order->order_number} {$this->status}")
            ->greeting("Hello {$notifiable->name}");

        if ($this->status === 'approved') {
            $message->line("Your order #{$this->order->order_number} has been approved!")
                   ->line('You will be notified once your order is ready.')
                   ->action('View Order', url("/orders/{$this->order->id}"));
        } else {
            $message->line("Your order #{$this->order->order_number} has been rejected.")
                   ->line("Reason: {$this->rejectionReason}")
                   ->line('We apologize for any inconvenience caused.')
                   ->action('Place New Order', url('/menu'));
        }

        return $message->line('Thank you for choosing our service!');
    }

    public function toArray($notifiable): array
    {
        return [
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'status' => $this->status,
            'rejection_reason' => $this->rejectionReason,
        ];
    }
}
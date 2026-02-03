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
            ->subject(__('layout.emails.order_status.subject', ['order_number' => $this->order->order_number, 'status' => $this->status]))
            ->greeting(__('layout.emails.order_status.greeting', ['name' => $notifiable->name]));

        if ($this->status === 'approved') {
            $message->line(__('layout.emails.order_status.approved_body', ['order_number' => $this->order->order_number]))
                ->line(__('layout.emails.order_status.approved_next'))
                ->action(__('layout.emails.order_status.view_order'), url("/orders/{$this->order->id}"));
        } else {
            $message->line(__('layout.emails.order_status.rejected_body', ['order_number' => $this->order->order_number]))
                ->line(__('layout.emails.order_status.rejection_reason', ['reason' => $this->rejectionReason]))
                ->line(__('layout.emails.order_status.apology'))
                ->action(__('layout.emails.order_status.place_new_order'), url('/menu'));
        }

        return $message->line(__('layout.emails.order_status.closing'));
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
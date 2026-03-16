<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StandardNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $title;
    public $bodyMessage;
    public $actionUrl;

    /**
     * Create a new message instance.
     */
    public function __construct($title, $bodyMessage, $actionUrl = null)
    {
        $this->title = $title;
        $this->bodyMessage = $bodyMessage;
        $this->actionUrl = $actionUrl;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->title,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.standard-notification',
            with: [
                'title' => $this->title,
                'bodyMessage' => $this->bodyMessage,
                'actionUrl' => $this->actionUrl,
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}

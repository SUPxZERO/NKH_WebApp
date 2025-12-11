<?php

namespace App\Mail;

use App\Models\Payment;
use App\Services\ReceiptService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class PaymentReceiptMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Payment $payment;
    public array $receiptData;
    protected ?string $pdfPath = null;

    /**
     * Create a new message instance.
     */
    public function __construct(Payment $payment, bool $attachPdf = true)
    {
        $this->payment = $payment;
        
        $receiptService = app(ReceiptService::class);
        $this->receiptData = $receiptService->getReceiptData($payment);
        
        if ($attachPdf) {
            $this->pdfPath = $receiptService->generatePdf($payment);
        }
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Payment Receipt - Order #' . ($this->receiptData['order_number'] ?? $this->payment->reference_number),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.payment-receipt',
            with: [
                'receipt' => $this->receiptData,
                'payment' => $this->payment,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        $attachments = [];
        
        if ($this->pdfPath && Storage::disk('public')->exists($this->pdfPath)) {
            $attachments[] = Attachment::fromStorage($this->pdfPath)
                ->as('receipt_' . $this->payment->reference_number . '.pdf')
                ->withMime('application/pdf');
        }
        
        return $attachments;
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\PaymentAuditLog;
use App\Services\InvoiceService;
use App\Services\LoyaltyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;
use Stripe\Event;

class StripeWebhookController extends Controller
{
    protected InvoiceService $invoiceService;
    protected LoyaltyService $loyaltyService;

    public function __construct(InvoiceService $invoiceService, LoyaltyService $loyaltyService)
    {
        $this->invoiceService = $invoiceService;
        $this->loyaltyService = $loyaltyService;
    }

    /**
     * Handle Stripe webhook events.
     * 
     * POST /api/webhooks/stripe
     */
    public function handle(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $webhookSecret = config('services.stripe.webhook_secret');

        // Verify webhook signature if secret is configured
        if ($webhookSecret) {
            try {
                $event = Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
            } catch (SignatureVerificationException $e) {
                Log::warning('Stripe webhook signature verification failed', [
                    'error' => $e->getMessage(),
                ]);
                return response()->json(['error' => 'Invalid signature'], 400);
            }
        } else {
            // Development mode - parse without verification
            $event = Event::constructFrom(json_decode($payload, true));
            Log::warning('Stripe webhook received without signature verification (development mode)');
        }

        Log::info('Stripe webhook received', [
            'type' => $event->type,
            'id' => $event->id,
        ]);

        // Handle specific event types
        try {
            match ($event->type) {
                'payment_intent.succeeded' => $this->handlePaymentIntentSucceeded($event),
                'payment_intent.payment_failed' => $this->handlePaymentIntentFailed($event),
                'payment_intent.canceled' => $this->handlePaymentIntentCanceled($event),
                'charge.refunded' => $this->handleChargeRefunded($event),
                default => Log::info("Unhandled Stripe event type: {$event->type}"),
            };
        } catch (\Exception $e) {
            Log::error('Error processing Stripe webhook', [
                'type' => $event->type,
                'error' => $e->getMessage(),
            ]);
            // Return 200 to prevent Stripe from retrying
            return response()->json(['error' => $e->getMessage()], 200);
        }

        return response()->json(['received' => true]);
    }

    /**
     * Handle successful payment.
     */
    protected function handlePaymentIntentSucceeded(Event $event): void
    {
        $paymentIntent = $event->data->object;
        
        $payment = $this->findPaymentByPaymentIntent($paymentIntent->id);
        if (!$payment) {
            Log::warning('Payment not found for PaymentIntent', [
                'payment_intent_id' => $paymentIntent->id,
            ]);
            return;
        }

        if (!$payment->isPending()) {
            Log::info('Payment already processed', [
                'payment_id' => $payment->id,
                'status' => $payment->status,
            ]);
            return;
        }

        DB::transaction(function () use ($payment, $paymentIntent) {
            $oldStatus = $payment->status;

            $payment->update([
                'status' => Payment::STATUS_COMPLETED,
                'processed_at' => now(),
                'gateway_reference' => $paymentIntent->id,
                'metadata' => array_merge($payment->metadata ?? [], [
                    'stripe_payment_method' => $paymentIntent->payment_method,
                    'stripe_charge_id' => $paymentIntent->latest_charge ?? null,
                ]),
            ]);

            PaymentAuditLog::logWebhook(
                $payment,
                'stripe_payment_succeeded',
                $oldStatus,
                Payment::STATUS_COMPLETED,
                [
                    'payment_intent_id' => $paymentIntent->id,
                    'amount' => $paymentIntent->amount / 100,
                ]
            );

            // Update invoice
            $invoice = $payment->invoice;
            $invoice->loadMissing('payments', 'order');
            $this->invoiceService->reconcileStatus($invoice);

            // Award loyalty points
            if ($invoice->order) {
                $this->loyaltyService->awardPoints($invoice->order);
            }
        });

        Log::info('Stripe payment completed', [
            'payment_id' => $payment->id,
            'payment_intent_id' => $paymentIntent->id,
        ]);
    }

    /**
     * Handle failed payment.
     */
    protected function handlePaymentIntentFailed(Event $event): void
    {
        $paymentIntent = $event->data->object;
        
        $payment = $this->findPaymentByPaymentIntent($paymentIntent->id);
        if (!$payment) {
            return;
        }

        if (!$payment->isPending()) {
            return;
        }

        $failureMessage = $paymentIntent->last_payment_error?->message ?? 'Payment failed';

        $payment->update([
            'status' => Payment::STATUS_FAILED,
            'failure_reason' => $failureMessage,
            'retry_count' => $payment->retry_count + 1,
        ]);

        PaymentAuditLog::logWebhook(
            $payment,
            'stripe_payment_failed',
            Payment::STATUS_PENDING,
            Payment::STATUS_FAILED,
            [
                'payment_intent_id' => $paymentIntent->id,
                'failure_reason' => $failureMessage,
                'failure_code' => $paymentIntent->last_payment_error?->code ?? null,
            ]
        );

        Log::info('Stripe payment failed', [
            'payment_id' => $payment->id,
            'reason' => $failureMessage,
        ]);
    }

    /**
     * Handle canceled payment intent.
     */
    protected function handlePaymentIntentCanceled(Event $event): void
    {
        $paymentIntent = $event->data->object;
        
        $payment = $this->findPaymentByPaymentIntent($paymentIntent->id);
        if (!$payment) {
            return;
        }

        $payment->update([
            'status' => Payment::STATUS_CANCELLED,
            'failure_reason' => 'Payment canceled',
        ]);

        PaymentAuditLog::logWebhook(
            $payment,
            'stripe_payment_canceled',
            $payment->status,
            Payment::STATUS_CANCELLED,
            ['payment_intent_id' => $paymentIntent->id]
        );
    }

    /**
     * Handle refund.
     */
    protected function handleChargeRefunded(Event $event): void
    {
        $charge = $event->data->object;
        
        // Find payment by charge or payment intent
        $payment = $this->findPaymentByPaymentIntent($charge->payment_intent);
        if (!$payment) {
            return;
        }

        $amountRefunded = $charge->amount_refunded / 100;

        // Update payment metadata with refund info
        $payment->update([
            'metadata' => array_merge($payment->metadata ?? [], [
                'stripe_refunded_amount' => $amountRefunded,
                'stripe_refund_id' => $charge->refunds?->data[0]?->id ?? null,
            ]),
        ]);

        // If fully refunded, update status
        if ($charge->refunded) {
            $payment->update(['status' => Payment::STATUS_REFUNDED]);
        }

        PaymentAuditLog::logWebhook(
            $payment,
            'stripe_refund_processed',
            $payment->status,
            $charge->refunded ? Payment::STATUS_REFUNDED : $payment->status,
            [
                'refunded_amount' => $amountRefunded,
                'fully_refunded' => $charge->refunded,
            ]
        );

        Log::info('Stripe refund processed', [
            'payment_id' => $payment->id,
            'amount_refunded' => $amountRefunded,
        ]);
    }

    /**
     * Find payment by Stripe PaymentIntent ID.
     */
    protected function findPaymentByPaymentIntent(string $paymentIntentId): ?Payment
    {
        return Payment::where('gateway_reference', $paymentIntentId)->first()
            ?? Payment::whereJsonContains('metadata->stripe_payment_intent_id', $paymentIntentId)->first();
    }
}

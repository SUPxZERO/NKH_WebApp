<?php

namespace App\Services\Payment\Strategies;

use App\Models\Order;
use App\Models\Payment;
use App\Services\Payment\PaymentStrategyInterface;
use Stripe\StripeClient;
use Stripe\PaymentIntent;
use Illuminate\Support\Facades\Log;

class StripePaymentStrategy implements PaymentStrategyInterface
{
    protected StripeClient $stripe;

    public function __construct()
    {
        $this->stripe = new StripeClient(config('services.stripe.secret'));
    }

    /**
     * Initiate a Stripe payment by creating a PaymentIntent.
     */
    public function initiate(Order $order, Payment $payment): void
    {
        try {
            // Create a PaymentIntent with Stripe
            $paymentIntent = $this->stripe->paymentIntents->create([
                'amount' => (int) ($payment->amount * 100), // Stripe uses cents
                'currency' => strtolower($payment->currency ?? config('services.stripe.currency', 'usd')),
                'automatic_payment_methods' => [
                    'enabled' => true,
                ],
                'metadata' => [
                    'payment_id' => $payment->id,
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer_id' => $order->customer_id,
                ],
                'description' => "Order #{$order->order_number} at NKH Restaurant",
            ]);

            // Store the PaymentIntent ID and client secret in payment metadata
            $payment->update([
                'gateway_reference' => $paymentIntent->id,
                'metadata' => array_merge($payment->metadata ?? [], [
                    'stripe_payment_intent_id' => $paymentIntent->id,
                    'stripe_client_secret' => $paymentIntent->client_secret,
                    'stripe_status' => $paymentIntent->status,
                ]),
            ]);

            Log::info('Stripe PaymentIntent created', [
                'payment_id' => $payment->id,
                'payment_intent_id' => $paymentIntent->id,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create Stripe PaymentIntent', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
            throw new \Exception('Failed to initialize card payment: ' . $e->getMessage());
        }
    }

    /**
     * Format the response for the frontend with Stripe client secret.
     */
    public function formatResponse(Payment $payment, Order $order): array
    {
        $metadata = $payment->metadata ?? [];

        return [
            'success' => true,
            'type' => 'card',
            'payment' => [
                'id' => $payment->id,
                'uuid' => $payment->uuid,
                'status' => $payment->status,
                'amount' => (float) $payment->amount,
                'currency' => $payment->currency,
                'reference_number' => $payment->reference_number,
                'transaction_id' => $payment->transaction_id,
                'expires_at' => $payment->expires_at?->toIso8601String(),
                'expires_in_seconds' => $payment->expires_at ? max(0, now()->diffInSeconds($payment->expires_at, false)) : null,
            ],
            'stripe' => [
                'client_secret' => $metadata['stripe_client_secret'] ?? null,
                'payment_intent_id' => $metadata['stripe_payment_intent_id'] ?? null,
                'publishable_key' => config('services.stripe.key'),
            ],
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'total' => (float) $order->total_amount,
            ],
        ];
    }

    /**
     * Get the payment method code.
     */
    public function getCode(): string
    {
        return 'card';
    }

    /**
     * Verify a PaymentIntent status with Stripe.
     */
    public function verifyPaymentIntent(string $paymentIntentId): array
    {
        try {
            $paymentIntent = $this->stripe->paymentIntents->retrieve($paymentIntentId);
            
            return [
                'id' => $paymentIntent->id,
                'status' => $paymentIntent->status,
                'amount' => $paymentIntent->amount / 100,
                'currency' => $paymentIntent->currency,
                'succeeded' => $paymentIntent->status === 'succeeded',
            ];
        } catch (\Exception $e) {
            Log::error('Failed to verify PaymentIntent', [
                'payment_intent_id' => $paymentIntentId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Cancel a PaymentIntent.
     */
    public function cancelPaymentIntent(string $paymentIntentId): bool
    {
        try {
            $this->stripe->paymentIntents->cancel($paymentIntentId);
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to cancel PaymentIntent', [
                'payment_intent_id' => $paymentIntentId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Create a refund for a PaymentIntent.
     */
    public function refund(string $paymentIntentId, ?int $amountInCents = null): array
    {
        try {
            $params = ['payment_intent' => $paymentIntentId];
            if ($amountInCents) {
                $params['amount'] = $amountInCents;
            }

            $refund = $this->stripe->refunds->create($params);
            
            return [
                'id' => $refund->id,
                'status' => $refund->status,
                'amount' => $refund->amount / 100,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to create refund', [
                'payment_intent_id' => $paymentIntentId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}

<?php

namespace App\Services\Payment\Strategies;

use App\Models\Order;
use App\Models\Payment;
use App\Services\Payment\PaymentStrategyInterface;

class CardPaymentStrategy implements PaymentStrategyInterface
{
    public function getCode(): string
    {
        return 'card';
    }

    public function initiate(Order $order, Payment $payment): void
    {
        // Here we would typically integrate with Stripe, PayPal, etc.
    }

    public function formatResponse(Payment $payment, Order $order): array
    {
        return [
            'success' => true,
            'payment' => [
                'id' => $payment->id,
                'uuid' => $payment->uuid,
                'status' => $payment->status,
                'amount' => (float) $payment->amount,
                'currency' => $payment->currency,
            ],
            'type' => 'card',
            'instructions' => 'Card payment integration pending.',
             'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'total' => (float) $order->total_amount,
            ],
        ];
    }
}

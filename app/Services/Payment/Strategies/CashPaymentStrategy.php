<?php

namespace App\Services\Payment\Strategies;

use App\Models\Order;
use App\Models\Payment;
use App\Services\Payment\PaymentStrategyInterface;

class CashPaymentStrategy implements PaymentStrategyInterface
{
    public function getCode(): string
    {
        return 'cash';
    }

    public function initiate(Order $order, Payment $payment): void
    {
        // Cash payment initiation often implies it's pending cashier action
        // We might want to auto-confirm it here or just leave it pending
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
                'reference_number' => $payment->reference_number,
                'transaction_id' => $payment->transaction_id,
            ],
            'type' => 'cash',
            'instructions' => 'Please proceed to the counter to complete your payment.',
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'total' => (float) $order->total_amount,
            ],
        ];
    }
}

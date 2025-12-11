<?php

namespace App\Services\Payment\Strategies;

use App\Models\Order;
use App\Models\Payment;
use App\Services\Payment\PaymentStrategyInterface;
use App\Services\QrCodeGenerator;

class QrPaymentStrategy implements PaymentStrategyInterface
{
    protected QrCodeGenerator $qrGenerator;

    public function __construct(QrCodeGenerator $qrGenerator)
    {
        $this->qrGenerator = $qrGenerator;
    }

    public function getCode(): string
    {
        return 'qr';
    }

    public function initiate(Order $order, Payment $payment): void
    {
        // QR specific initiation logic if any
        // For now, references are already generated in PaymentService
    }

    public function formatResponse(Payment $payment, Order $order): array
    {
        $qrData = $this->qrGenerator->generateQrkhData($payment, $order);
        
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
                'expires_at' => $payment->expires_at?->toIso8601String(),
                'expires_in_seconds' => $payment->expires_at ? now()->diffInSeconds($payment->expires_at, false) : null,
            ],
            'type' => 'qr',
            'qr_code' => [
                'data' => $qrData['qr_data'],
                'reference' => $qrData['qr_reference'],
                'image_svg' => $this->qrGenerator->generateSvg($qrData['qr_data']),
                'image_base64' => $this->qrGenerator->generateBase64($qrData['qr_data']),
            ],
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'total' => (float) $order->total_amount,
            ],
        ];
    }
}

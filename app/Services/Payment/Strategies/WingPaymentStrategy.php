<?php

namespace App\Services\Payment\Strategies;

use App\Models\Order;
use App\Models\Payment;
use App\Services\Payment\PaymentStrategyInterface;
use App\Services\QrCodeGenerator;
use Illuminate\Support\Facades\Log;

class WingPaymentStrategy implements PaymentStrategyInterface
{
    protected QrCodeGenerator $qrGenerator;

    public function __construct(QrCodeGenerator $qrGenerator)
    {
        $this->qrGenerator = $qrGenerator;
    }

    /**
     * Initiate a Wing Money payment.
     * 
     * Wing uses the KHQR/Bakong standard for QR payments.
     */
    public function initiate(Order $order, Payment $payment): void
    {
        // Generate Wing-specific QR reference
        $wingReference = $this->generateWingReference($payment);
        
        $payment->update([
            'qr_reference' => $wingReference,
            'metadata' => array_merge($payment->metadata ?? [], [
                'provider' => 'wing',
                'wing_reference' => $wingReference,
            ]),
        ]);

        Log::info('Wing payment initiated', [
            'payment_id' => $payment->id,
            'wing_reference' => $wingReference,
        ]);
    }

    /**
     * Format the response for the frontend.
     */
    public function formatResponse(Payment $payment, Order $order): array
    {
        // Generate the Wing QR code
        $qrData = $this->generateWingQrData($payment, $order);
        $qrImageBase64 = $this->qrGenerator->generateBase64($qrData['qr_data'], 300);

        return [
            'success' => true,
            'type' => 'qr',
            'provider' => 'wing',
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
            'qr_code' => [
                'image_base64' => $qrImageBase64,
                'reference' => $payment->qr_reference,
                'raw_data' => $qrData['qr_data'],
            ],
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'total' => (float) $order->total_amount,
            ],
            'instructions' => [
                'Open your Wing app',
                'Tap "Scan QR"',
                'Scan this QR code',
                'Verify the amount',
                'Enter PIN to confirm',
            ],
        ];
    }

    /**
     * Get the payment method code.
     */
    public function getCode(): string
    {
        return 'wing';
    }

    /**
     * Generate Wing-specific reference number.
     */
    protected function generateWingReference(Payment $payment): string
    {
        $prefix = 'WING';
        $timestamp = now()->format('ymdHis');
        $random = strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 5));
        
        return $prefix . $timestamp . $random;
    }

    /**
     * Generate Wing QR code data.
     */
    protected function generateWingQrData(Payment $payment, Order $order): array
    {
        $merchantId = config('payment.wing.merchant_id', env('WING_MERCHANT_ID', 'NKH_RESTAURANT'));
        $merchantName = config('payment.wing.merchant_name', 'NKH Restaurant');
        $merchantCity = config('payment.wing.merchant_city', 'Phnom Penh');
        
        // Build EMV QR code payload for Wing
        $qrData = $this->buildWingEmvPayload([
            'merchant_id' => $merchantId,
            'merchant_name' => $merchantName,
            'merchant_city' => $merchantCity,
            'amount' => (float) $payment->amount,
            'currency' => $payment->currency ?? 'USD',
            'reference' => $payment->reference_number,
            'qr_reference' => $payment->qr_reference,
        ]);

        return [
            'qr_data' => $qrData,
            'qr_reference' => $payment->qr_reference,
            'amount' => (float) $payment->amount,
            'currency' => $payment->currency ?? 'USD',
        ];
    }

    /**
     * Build EMV QR code payload for Wing.
     */
    protected function buildWingEmvPayload(array $data): string
    {
        $payload = '';
        
        // 00 - Payload Format Indicator
        $payload .= $this->buildTlv('00', '01');
        
        // 01 - Point of Initiation Method
        $payload .= $this->buildTlv('01', '12');
        
        // 29 - Merchant Account Information (Wing)
        $merchantInfo = $this->buildTlv('00', 'wing@bakong');
        $merchantInfo .= $this->buildTlv('01', $data['merchant_id']);
        if (!empty($data['qr_reference'])) {
            $merchantInfo .= $this->buildTlv('02', $data['qr_reference']);
        }
        $payload .= $this->buildTlv('29', $merchantInfo);
        
        // 52 - Merchant Category Code
        $payload .= $this->buildTlv('52', '5812');
        
        // 53 - Transaction Currency
        $currencyCode = strtoupper($data['currency']) === 'KHR' ? '116' : '840';
        $payload .= $this->buildTlv('53', $currencyCode);
        
        // 54 - Transaction Amount
        $payload .= $this->buildTlv('54', number_format($data['amount'], 2, '.', ''));
        
        // 58 - Country Code
        $payload .= $this->buildTlv('58', 'KH');
        
        // 59 - Merchant Name
        $payload .= $this->buildTlv('59', substr($data['merchant_name'], 0, 25));
        
        // 60 - Merchant City
        $payload .= $this->buildTlv('60', substr($data['merchant_city'], 0, 15));
        
        // 62 - Additional Data
        $additionalData = $this->buildTlv('05', $data['qr_reference']);
        $payload .= $this->buildTlv('62', $additionalData);
        
        // 63 - CRC
        $crc = $this->calculateCrc16($payload . '6304');
        $payload .= '6304' . strtoupper(str_pad(dechex($crc), 4, '0', STR_PAD_LEFT));
        
        return $payload;
    }

    protected function buildTlv(string $tag, string $value): string
    {
        $length = str_pad(strlen($value), 2, '0', STR_PAD_LEFT);
        return $tag . $length . $value;
    }

    protected function calculateCrc16(string $data): int
    {
        $crc = 0xFFFF;
        $polynomial = 0x1021;
        
        for ($i = 0; $i < strlen($data); $i++) {
            $crc ^= (ord($data[$i]) << 8);
            for ($j = 0; $j < 8; $j++) {
                if ($crc & 0x8000) {
                    $crc = (($crc << 1) ^ $polynomial) & 0xFFFF;
                } else {
                    $crc = ($crc << 1) & 0xFFFF;
                }
            }
        }
        
        return $crc;
    }
}

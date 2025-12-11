<?php

namespace App\Services\Payment\Strategies;

use App\Models\Order;
use App\Models\Payment;
use App\Services\Payment\PaymentStrategyInterface;
use App\Services\QrCodeGenerator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class AbaPaymentStrategy implements PaymentStrategyInterface
{
    protected QrCodeGenerator $qrGenerator;

    public function __construct(QrCodeGenerator $qrGenerator)
    {
        $this->qrGenerator = $qrGenerator;
    }

    /**
     * Initiate an ABA Pay payment.
     * 
     * ABA Pay uses the KHQR standard with ABA-specific merchant account info.
     * If Bakong API is enabled, it creates a payment request through Bakong.
     */
    public function initiate(Order $order, Payment $payment): void
    {
        // Generate ABA-specific QR reference
        $abaReference = $this->generateAbaReference($payment);
        
        $payment->update([
            'qr_reference' => $abaReference,
            'metadata' => array_merge($payment->metadata ?? [], [
                'provider' => 'aba_pay',
                'aba_reference' => $abaReference,
            ]),
        ]);

        // If Bakong API is enabled, create a payment request
        if (config('payment.bakong.enabled', false)) {
            $this->createBakongPaymentRequest($payment, $order);
        }

        Log::info('ABA Pay payment initiated', [
            'payment_id' => $payment->id,
            'aba_reference' => $abaReference,
        ]);
    }

    /**
     * Format the response for the frontend.
     */
    public function formatResponse(Payment $payment, Order $order): array
    {
        // Generate the ABA Pay QR code
        $qrData = $this->generateAbaQrData($payment, $order);
        $qrImageBase64 = $this->qrGenerator->generateBase64($qrData['qr_data'], 300);

        return [
            'success' => true,
            'type' => 'qr', // Uses QR display component
            'provider' => 'aba_pay',
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
                'Open your ABA Mobile app',
                'Tap "Scan" or "Pay QR"',
                'Scan this QR code',
                'Confirm the payment amount',
                'Enter your PIN to complete',
            ],
        ];
    }

    /**
     * Get the payment method code.
     */
    public function getCode(): string
    {
        return 'aba_pay';
    }

    /**
     * Generate ABA-specific reference number.
     */
    protected function generateAbaReference(Payment $payment): string
    {
        $prefix = 'ABA';
        $timestamp = now()->format('ymdHis');
        $random = strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));
        
        return $prefix . $timestamp . $random;
    }

    /**
     * Generate ABA Pay QR code data.
     * 
     * ABA Pay follows the KHQR standard with ABA-specific merchant info.
     */
    protected function generateAbaQrData(Payment $payment, Order $order): array
    {
        $merchantId = config('payment.aba.merchant_id', env('ABA_MERCHANT_ID', 'NKH_RESTAURANT'));
        $merchantName = config('payment.aba.merchant_name', 'NKH Restaurant');
        $merchantCity = config('payment.aba.merchant_city', 'Phnom Penh');
        
        // Build EMV QR code payload for ABA
        $qrData = $this->buildAbaEmvPayload([
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
     * Build EMV QR code payload for ABA Pay.
     * 
     * ABA follows the KHQR/Bakong standard.
     */
    protected function buildAbaEmvPayload(array $data): string
    {
        $payload = '';
        
        // 00 - Payload Format Indicator
        $payload .= $this->buildTlv('00', '01');
        
        // 01 - Point of Initiation Method (12 = Dynamic, 11 = Static)
        $payload .= $this->buildTlv('01', '12');
        
        // 29 - Merchant Account Information (ABA Bank)
        // ABA uses bakong_account_id format: phone@aba
        $merchantInfo = $this->buildTlv('00', 'aba@bakong');
        $merchantInfo .= $this->buildTlv('01', $data['merchant_id']);
        if (!empty($data['qr_reference'])) {
            $merchantInfo .= $this->buildTlv('02', $data['qr_reference']);
        }
        $payload .= $this->buildTlv('29', $merchantInfo);
        
        // 52 - Merchant Category Code
        $payload .= $this->buildTlv('52', '5812'); // Restaurant
        
        // 53 - Transaction Currency (840 = USD, 116 = KHR)
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
        $additionalData = $this->buildTlv('05', $data['qr_reference']); // Reference Label
        if (!empty($data['reference'])) {
            $additionalData .= $this->buildTlv('01', $data['reference']); // Bill Number
        }
        $payload .= $this->buildTlv('62', $additionalData);
        
        // 63 - CRC (checksum)
        $crc = $this->calculateCrc16($payload . '6304');
        $payload .= '6304' . strtoupper(str_pad(dechex($crc), 4, '0', STR_PAD_LEFT));
        
        return $payload;
    }

    /**
     * Build TLV (Tag-Length-Value) field.
     */
    protected function buildTlv(string $tag, string $value): string
    {
        $length = str_pad(strlen($value), 2, '0', STR_PAD_LEFT);
        return $tag . $length . $value;
    }

    /**
     * Calculate CRC16-CCITT checksum.
     */
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

    /**
     * Create a payment request through Bakong API (if enabled).
     * 
     * This allows for real-time payment notifications.
     */
    protected function createBakongPaymentRequest(Payment $payment, Order $order): void
    {
        $bakongToken = config('payment.bakong.token');
        if (!$bakongToken) {
            Log::warning('Bakong API token not configured');
            return;
        }

        try {
            $response = Http::withToken($bakongToken)
                ->post(config('payment.bakong.api_url', 'https://api.bakong.nbc.gov.kh/v1') . '/payment-request', [
                    'merchant_id' => config('payment.aba.merchant_id'),
                    'amount' => (float) $payment->amount,
                    'currency' => $payment->currency,
                    'reference' => $payment->qr_reference,
                    'description' => "Order #{$order->order_number}",
                    'callback_url' => config('app.url') . '/api/webhooks/bakong',
                ]);

            if ($response->successful()) {
                $payment->update([
                    'metadata' => array_merge($payment->metadata ?? [], [
                        'bakong_request_id' => $response->json('request_id'),
                    ]),
                ]);
                
                Log::info('Bakong payment request created', [
                    'payment_id' => $payment->id,
                    'request_id' => $response->json('request_id'),
                ]);
            } else {
                Log::error('Bakong payment request failed', [
                    'payment_id' => $payment->id,
                    'error' => $response->body(),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Bakong API error', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}

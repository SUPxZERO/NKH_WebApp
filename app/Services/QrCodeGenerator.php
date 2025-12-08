<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\Log;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class QrCodeGenerator
{
    /**
     * Generate QRKH-compatible QR code data for a payment.
     */
    public function generateQrkhData(Payment $payment, Order $order): array
    {
        $merchantId = config('payment.qrkh.merchant_id', 'NKH001');
        $merchantName = config('payment.qrkh.merchant_name', 'NKH Restaurant');
        $merchantCity = config('payment.qrkh.merchant_city', 'Phnom Penh');
        
        // Build EMV QR code payload
        $qrData = $this->buildEmvPayload([
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
            'expires_at' => $payment->expires_at?->toIso8601String(),
        ];
    }

    /**
     * Generate QR code image as SVG.
     */
    public function generateSvg(string $data, int $size = 300): string
    {
        try {
            // Check if QrCode facade is available
            if (class_exists('SimpleSoftwareIO\QrCode\Facades\QrCode')) {
                return QrCode::format('svg')
                    ->size($size)
                    ->margin(2)
                    ->generate($data);
            }
        } catch (\Exception $e) {
            Log::warning('QR code generation failed, using placeholder', [
                'error' => $e->getMessage(),
            ]);
        }

        // Return placeholder SVG if QrCode package not available
        return $this->generatePlaceholderSvg($size, $data);
    }

    /**
     * Generate QR code as base64 encoded SVG for embedding in HTML.
     */
    public function generateBase64(string $data, int $size = 300): string
    {
        try {
            if (class_exists('SimpleSoftwareIO\QrCode\Facades\QrCode')) {
                // Use SVG format since it doesn't require imagick extension
                $svg = QrCode::format('svg')
                    ->size($size)
                    ->margin(2)
                    ->generate($data);
                    
                return 'data:image/svg+xml;base64,' . base64_encode($svg);
            }
        } catch (\Exception $e) {
            Log::warning('QR code base64 generation failed', [
                'error' => $e->getMessage(),
            ]);
        }

        // Return a simple data URL with the reference
        return 'data:image/svg+xml;base64,' . base64_encode($this->generatePlaceholderSvg($size, $data));
    }

    /**
     * Build EMV QR code payload (simplified QRKH format).
     * 
     * Note: This is a simplified implementation. Production should use
     * the full EMV QR specification as defined by NBC Cambodia.
     */
    private function buildEmvPayload(array $data): string
    {
        $payload = '';
        
        // 00 - Payload Format Indicator
        $payload .= $this->buildTlv('00', '01');
        
        // 01 - Point of Initiation Method (12 = Dynamic)
        $payload .= $this->buildTlv('01', '12');
        
        // 29 - Merchant Account Information (QRKH)
        $merchantInfo = $this->buildTlv('00', 'QRKH.NBC');
        $merchantInfo .= $this->buildTlv('01', $data['merchant_id']);
        $payload .= $this->buildTlv('29', $merchantInfo);
        
        // 52 - Merchant Category Code
        $payload .= $this->buildTlv('52', '5812'); // Restaurant
        
        // 53 - Transaction Currency (840 = USD, 116 = KHR)
        $currencyCode = $data['currency'] === 'KHR' ? '116' : '840';
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
        
        // 63 - CRC (checksum)
        $crc = $this->calculateCrc16($payload . '6304');
        $payload .= '6304' . strtoupper(dechex($crc));
        
        return $payload;
    }

    /**
     * Build TLV (Tag-Length-Value) field.
     */
    private function buildTlv(string $tag, string $value): string
    {
        $length = str_pad(strlen($value), 2, '0', STR_PAD_LEFT);
        return $tag . $length . $value;
    }

    /**
     * Calculate CRC16-CCITT checksum.
     */
    private function calculateCrc16(string $data): int
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
     * Generate placeholder SVG when QR code library is not available.
     */
    private function generatePlaceholderSvg(int $size, string $data): string
    {
        $ref = htmlspecialchars(substr($data, 0, 20));
        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="$size" height="$size" viewBox="0 0 $size $size">
  <rect width="100%" height="100%" fill="#f0f0f0"/>
  <text x="50%" y="45%" text-anchor="middle" font-size="14" fill="#666">QR Code</text>
  <text x="50%" y="55%" text-anchor="middle" font-size="10" fill="#999">$ref</text>
  <text x="50%" y="70%" text-anchor="middle" font-size="10" fill="#666">Install: simple-qrcode</text>
</svg>
SVG;
    }
}

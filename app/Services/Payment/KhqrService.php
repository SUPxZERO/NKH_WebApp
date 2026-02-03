<?php

declare(strict_types=1);

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentMethod;
use Illuminate\Support\Facades\Log;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

/**
 * KHQR (Bakong) QR Code Generation Service
 * 
 * Generates EMV-compliant KHQR codes following NBC Cambodia specification.
 * @see https://bakong.nbc.gov.kh/
 */
class KhqrService
{
    // Currency codes
    public const CURRENCY_KHR = 'KHR';
    public const CURRENCY_USD = 'USD';

    // ISO 4217 Currency codes
    private const ISO_CURRENCY_KHR = '116';
    private const ISO_CURRENCY_USD = '840';

    // Account types
    public const ACCOUNT_INDIVIDUAL = 'individual';
    public const ACCOUNT_MERCHANT = 'merchant';

    /**
     * Generate KHQR code for a payment.
     */
    public function generateKhqr(Payment $payment, Order $order): array
    {
        // Get payment method configuration
        $paymentMethod = PaymentMethod::where('code', 'qr')->first();
        $config = $this->getConfiguration($paymentMethod);

        // Determine amount and currency
        $currency = $payment->currency ?? $config['default_currency'];
        $amount = (float) $payment->amount;

        // Convert to KHR if needed
        if ($currency === self::CURRENCY_USD && $config['default_currency'] === self::CURRENCY_KHR) {
            $amount = $amount * config('payment.khr_exchange_rate', 4100);
            $currency = self::CURRENCY_KHR;
        }

        // Generate KHQR string
        $qrString = $this->buildKhqrString([
            'bakong_account_id' => $config['bakong_account_id'],
            'merchant_name' => $config['merchant_name'],
            'merchant_city' => $config['merchant_city'],
            'amount' => $amount,
            'currency' => $currency,
            'reference' => $payment->qr_reference ?? $payment->reference_number,
            'account_type' => $config['account_type'] ?? self::ACCOUNT_INDIVIDUAL,
        ]);

        // Generate MD5 hash for transaction verification
        $md5Hash = md5($qrString);

        return [
            'qr_string' => $qrString,
            'md5_hash' => $md5Hash,
            'amount' => $amount,
            'currency' => $currency,
            'reference' => $payment->qr_reference,
            'bakong_account_id' => $config['bakong_account_id'],
        ];
    }

    /**
     * Build KHQR EMV string following NBC specification.
     */
    private function buildKhqrString(array $data): string
    {
        $payload = '';

        // ID 00 - Payload Format Indicator (mandatory, value "01")
        $payload .= $this->tlv('00', '01');

        // ID 01 - Point of Initiation Method
        // "11" = Static, "12" = Dynamic (with amount)
        $initMethod = !empty($data['amount']) && $data['amount'] > 0 ? '12' : '11';
        $payload .= $this->tlv('01', $initMethod);

        // ID 29 - Merchant Account Information (Bakong)
        $merchantAccount = $this->buildMerchantAccountInfo($data);
        $payload .= $this->tlv('29', $merchantAccount);

        // ID 52 - Merchant Category Code
        // Bakong uses 5999 (Miscellaneous) as default
        $payload .= $this->tlv('52', '5999');

        // ID 53 - Transaction Currency
        $currencyCode = $data['currency'] === self::CURRENCY_KHR
            ? self::ISO_CURRENCY_KHR
            : self::ISO_CURRENCY_USD;
        $payload .= $this->tlv('53', $currencyCode);

        // ID 54 - Transaction Amount (if dynamic)
        if (!empty($data['amount']) && $data['amount'] > 0) {
            $formattedAmount = $data['currency'] === self::CURRENCY_KHR
                ? number_format($data['amount'], 0, '', '')
                : number_format($data['amount'], 2, '.', '');
            $payload .= $this->tlv('54', $formattedAmount);
        }

        // ID 58 - Country Code
        $payload .= $this->tlv('58', 'KH');

        // ID 59 - Merchant Name
        $merchantName = $this->sanitizeName($data['merchant_name'], 25);
        $payload .= $this->tlv('59', $merchantName);

        // ID 60 - Merchant City
        $merchantCity = $this->sanitizeName($data['merchant_city'], 15);
        $payload .= $this->tlv('60', $merchantCity);

        // ID 99 - Bakong Proprietary Template (Timestamp Extension)
        // This is a Bakong-specific extension required for proper QR validation
        $timestamp = $this->generateBakongTimestamp();
        $timestampData = $this->tlv('00', $timestamp);
        $payload .= $this->tlv('99', $timestampData);

        // ID 63 - CRC (Cyclic Redundancy Check)
        // CRC is calculated over the entire payload including "6304"
        $crcPayload = $payload . '6304';
        $crc = $this->calculateCrc16($crcPayload);
        $payload .= '6304' . strtoupper(sprintf('%04X', $crc));

        return $payload;
    }

    /**
     * Build Merchant Account Information (ID 29) for Bakong.
     * 
     * IMPORTANT: According to NBC Bakong KHQR specification:
     * - For INDIVIDUAL accounts: Sub-tag 00 contains the Bakong account ID directly
     * - For MERCHANT accounts: Sub-tag 00 = "khqr@nbc", Sub-tag 01 = account ID
     */
    private function buildMerchantAccountInfo(array $data): string
    {
        $info = '';

        if ($data['account_type'] === self::ACCOUNT_MERCHANT) {
            // Merchant Account Format:
            // Sub-ID 00 - Globally Unique Identifier (fixed value for Bakong)
            $info .= $this->tlv('00', 'khqr@nbc');

            // Sub-ID 01 - Bakong Merchant Account ID
            $info .= $this->tlv('01', $data['bakong_account_id']);

            // Sub-ID 02 - Merchant ID (optional, for registered merchants)
            if (!empty($data['merchant_id'])) {
                $info .= $this->tlv('02', $data['merchant_id']);
            }
        } else {
            // Individual Account Format:
            // Sub-ID 00 - Bakong Account ID (e.g., "username@bank")
            // NOTE: For individual accounts, sub-tag 01 is NOT used
            $info .= $this->tlv('00', $data['bakong_account_id']);
        }

        return $info;
    }

    /**
     * Build TLV (Tag-Length-Value) field.
     */
    private function tlv(string $tag, string $value): string
    {
        $length = strlen($value);
        return $tag . str_pad((string) $length, 2, '0', STR_PAD_LEFT) . $value;
    }

    /**
     * Calculate CRC-16/CCITT-FALSE checksum.
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
     * Generate Bakong timestamp in milliseconds format.
     * 
     * Returns a 13-digit timestamp (milliseconds since Unix epoch).
     */
    private function generateBakongTimestamp(): string
    {
        // Get current time in milliseconds (13 digits)
        $milliseconds = (int) (microtime(true) * 1000);
        return (string) $milliseconds;
    }

    /**
     * Sanitize name for KHQR (alphanumeric and spaces only).
     */
    private function sanitizeName(string $name, int $maxLength): string
    {
        // Remove non-ASCII characters
        $name = preg_replace('/[^\x20-\x7E]/', '', $name);
        // Trim and limit length
        return substr(trim($name), 0, $maxLength);
    }

    /**
     * Get configuration from PaymentMethod or fallback to config.
     */
    private function getConfiguration(?PaymentMethod $method): array
    {
        $config = $method?->configuration ?? [];

        return [
            'bakong_account_id' => $config['bakong_account_id']
                ?? config('payment.bakong.account_id', 'test@aclb'),
            'merchant_name' => $config['merchant_name']
                ?? config('payment.qrkh.merchant_name', 'NKH Restaurant'),
            'merchant_city' => $config['merchant_city']
                ?? config('payment.qrkh.merchant_city', 'Phnom Penh'),
            'default_currency' => $config['default_currency']
                ?? config('payment.default_currency', self::CURRENCY_USD),
            'account_type' => $config['account_type']
                ?? self::ACCOUNT_INDIVIDUAL,
        ];
    }

    /**
     * Generate QR code image as SVG.
     */
    public function generateQrSvg(string $qrString, int $size = 300): string
    {
        try {
            if (class_exists('SimpleSoftwareIO\QrCode\Facades\QrCode')) {
                $svg = QrCode::format('svg')
                    ->size($size)
                    ->margin(2)
                    ->generate($qrString);
                return (string) $svg;
            }
        } catch (\Exception $e) {
            Log::warning('QR SVG generation failed', ['error' => $e->getMessage()]);
        }

        return $this->generatePlaceholderSvg($size, 'Scan with Bakong');
    }

    /**
     * Generate QR code as base64.
     */
    public function generateQrBase64(string $qrString, int $size = 300): string
    {
        try {
            if (class_exists('SimpleSoftwareIO\QrCode\Facades\QrCode')) {
                $svg = QrCode::format('svg')
                    ->size($size)
                    ->margin(2)
                    ->generate($qrString);

                return 'data:image/svg+xml;base64,' . base64_encode((string) $svg);
            }
        } catch (\Exception $e) {
            Log::warning('QR base64 generation failed', ['error' => $e->getMessage()]);
        }

        return 'data:image/svg+xml;base64,' . base64_encode(
            $this->generatePlaceholderSvg($size, 'Scan with Bakong')
        );
    }

    /**
     * Generate placeholder SVG.
     */
    private function generatePlaceholderSvg(int $size, string $text): string
    {
        $escapedText = htmlspecialchars($text);
        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="$size" height="$size" viewBox="0 0 $size $size">
  <rect width="100%" height="100%" fill="#f0f0f0"/>
  <text x="50%" y="50%" text-anchor="middle" font-size="14" fill="#666">$escapedText</text>
</svg>
SVG;
    }
}

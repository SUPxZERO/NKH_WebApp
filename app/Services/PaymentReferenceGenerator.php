<?php

namespace App\Services;

use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class PaymentReferenceGenerator
{
    /**
     * Generate a unique payment reference number.
     * Format: NKH-{YYMMDD}-{LocationCode}-{Sequence}
     * Example: NKH-241208-PP01-00142
     */
    public function generate(Order $order): string
    {
        $date = now()->format('ymd');
        $locationCode = $this->getLocationCode($order);
        $sequence = $this->getNextSequence($date, $locationCode);
        
        return sprintf('NKH-%s-%s-%s', $date, $locationCode, $sequence);
    }

    /**
     * Generate a QR reference for QRKH payments.
     * Format: QR{YYMMDD}{Random6}
     * Example: QR241208ABC123
     */
    public function generateQrReference(): string
    {
        $date = now()->format('ymd');
        $random = strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
        
        return sprintf('QR%s%s', $date, $random);
    }

    /**
     * Generate a unique transaction ID.
     * Format: TXN-{Timestamp}-{Random}
     */
    public function generateTransactionId(): string
    {
        $timestamp = now()->format('YmdHis');
        $random = strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
        
        return sprintf('TXN-%s-%s', $timestamp, $random);
    }

    /**
     * Get location code for reference generation.
     */
    private function getLocationCode(Order $order): string
    {
        if ($order->location) {
            // Try to use first 4 chars of location name
            $name = preg_replace('/[^A-Z0-9]/i', '', $order->location->name ?? 'HQ');
            return strtoupper(substr($name, 0, 4));
        }
        
        return 'HQ01';
    }

    /**
     * Get next sequence number for the given date and location.
     */
    private function getNextSequence(string $date, string $locationCode): string
    {
        $key = "payment_seq_{$date}_{$locationCode}";
        
        // Use database for distributed environments, cache for single instance
        $sequence = DB::table('payments')
            ->where('reference_number', 'like', "NKH-{$date}-{$locationCode}-%")
            ->count() + 1;
        
        return str_pad($sequence, 5, '0', STR_PAD_LEFT);
    }
}

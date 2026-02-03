<?php

/**
 * KHQR Diagnostic Script
 * 
 * This script generates a test KHQR and displays its structure
 * to help diagnose QR scanning issues.
 */

use App\Services\Payment\KhqrService;
use App\Models\Payment;
use App\Models\Order;

// Get the latest payment or create test data
$payment = Payment::latest()->first();

if (!$payment) {
    echo "❌ No payment found. Please create a test payment.\n";
    exit(1);
}

$order = $payment->order;

if (!$order) {
    echo "❌ Payment has no associated order.\n";
    exit(1);
}

echo "╔══════════════════════════════════════════════════════════════╗\n";
echo "║             KHQR DIAGNOSTIC REPORT                          ║\n";
echo "╚══════════════════════════════════════════════════════════════╝\n\n";

echo "Payment Information:\n";
echo "  ID: {$payment->id}\n";
echo "  Reference: {$payment->reference_number}\n";
echo "  QR Reference: {$payment->qr_reference}\n";
echo "  Amount: {$payment->amount} {$payment->currency}\n";
echo "  Status: {$payment->status}\n\n";

// Generate KHQR
$khqrService = app(KhqrService::class);
$result = $khqrService->generateKhqr($payment, $order);

echo "KHQR Generation Result:\n";
echo "  Account ID: {$result['bakong_account_id']}\n";
echo "  Currency: {$result['currency']}\n";
echo "  Amount: {$result['amount']}\n";
echo "  MD5 Hash: {$result['md5_hash']}\n\n";

echo "KHQR String:\n";
echo str_repeat("─", 66) . "\n";
echo wordwrap($result['qr_string'], 66, "\n", true) . "\n";
echo str_repeat("─", 66) . "\n";
echo "Length: " . strlen($result['qr_string']) . " characters\n\n";

// Parse KHQR structure
echo "KHQR Structure Analysis:\n";
$qrString = $result['qr_string'];
$pos = 0;

function parseTLV($data, &$pos, $indent = "")
{
    $output = "";
    while ($pos < strlen($data) - 4) { // -4 to exclude CRC at end
        if (substr($data, $pos, 4) === '6304') {
            break; // CRC marker
        }

        $tag = substr($data, $pos, 2);
        $length = (int) substr($data, $pos + 2, 2);
        $value = substr($data, $pos + 4, $length);

        $output .= $indent . "Tag $tag (Length: $length): $value\n";

        // Special handling for Tag 29 (Merchant Account Info)
        if ($tag === '29') {
            $output .= $indent . "  └─ Merchant Account Info:\n";
            $subPos = 0;
            while ($subPos < strlen($value)) {
                $subTag = substr($value, $subPos, 2);
                $subLength = (int) substr($value, $subPos + 2, 2);
                $subValue = substr($value, $subPos + 4, $subLength);
                $output .= $indent . "     Sub-Tag $subTag: $subValue\n";
                $subPos += 4 + $subLength;
            }
        }

        // Special handling for Tag 62 (Additional Data)
        if ($tag === '62') {
            $output .= $indent . "  └─ Additional Data:\n";
            $subPos = 0;
            while ($subPos < strlen($value)) {
                $subTag = substr($value, $subPos, 2);
                $subLength = (int) substr($value, $subPos + 2, 2);
                $subValue = substr($value, $subPos + 4, $subLength);
                $output .= $indent . "     Sub-Tag $subTag: $subValue\n";
                $subPos += 4 + $subLength;
            }
        }

        $pos += 4 + $length;
    }
    return $output;
}

echo parseTLV($qrString, $pos, "  ");

// Extract and verify CRC
$crcStart = strpos($qrString, '6304');
if ($crcStart !== false) {
    $crc = substr($qrString, $crcStart + 4, 4);
    echo "\nCRC-16 Checksum: $crc\n";
}

echo "\n✅ KHQR generated successfully!\n";
echo "   You can now test scanning this QR with ABA Mobile app.\n\n";

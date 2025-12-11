<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Order;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\View;
use Barryvdh\DomPDF\Facade\Pdf;

class ReceiptService
{
    /**
     * Generate PDF receipt for a payment.
     * 
     * @param Payment $payment
     * @return string Path to the generated PDF
     */
    public function generatePdf(Payment $payment): string
    {
        $payment->load([
            'invoice.order.orderItems.menuItem',
            'invoice.order.customer.user',
            'invoice.location',
            'paymentMethod',
        ]);

        $data = $this->prepareReceiptData($payment);
        
        // Generate PDF using DomPDF
        $pdf = Pdf::loadView('receipts.payment', $data);
        $pdf->setPaper('a4', 'portrait');
        
        // Generate unique filename
        $filename = "receipts/receipt_{$payment->reference_number}_" . now()->format('YmdHis') . ".pdf";
        
        // Store the PDF
        Storage::disk('public')->put($filename, $pdf->output());
        
        return $filename;
    }

    /**
     * Generate thermal printer receipt (80mm width).
     * 
     * @param Payment $payment
     * @return string HTML formatted for thermal printing
     */
    public function generateThermalReceipt(Payment $payment): string
    {
        $payment->load([
            'invoice.order.orderItems.menuItem',
            'invoice.location',
            'paymentMethod',
        ]);

        $data = $this->prepareReceiptData($payment);
        
        return View::make('receipts.thermal', $data)->render();
    }

    /**
     * Generate receipt as HTML (for display or email).
     * 
     * @param Payment $payment
     * @return string HTML content
     */
    public function generateHtml(Payment $payment): string
    {
        $payment->load([
            'invoice.order.orderItems.menuItem',
            'invoice.order.customer.user',
            'invoice.location',
            'paymentMethod',
        ]);

        $data = $this->prepareReceiptData($payment);
        
        return View::make('receipts.payment', $data)->render();
    }

    /**
     * Get receipt data as array (for API response).
     * 
     * @param Payment $payment
     * @return array
     */
    public function getReceiptData(Payment $payment): array
    {
        $payment->load([
            'invoice.order.orderItems.menuItem',
            'invoice.order.customer.user',
            'invoice.location',
            'paymentMethod',
        ]);

        return $this->prepareReceiptData($payment);
    }

    /**
     * Prepare receipt data from payment.
     */
    protected function prepareReceiptData(Payment $payment): array
    {
        $invoice = $payment->invoice;
        $order = $invoice?->order;
        $location = $invoice?->location;

        // Get business info
        $businessName = config('app.name', 'NKH Restaurant');
        $businessAddress = $location?->address ?? config('payment.receipt.address', 'Phnom Penh, Cambodia');
        $businessPhone = $location?->phone ?? config('payment.receipt.phone', '');
        
        // Prepare order items
        $items = [];
        if ($order && $order->orderItems) {
            foreach ($order->orderItems as $item) {
                $items[] = [
                    'name' => $item->menuItem?->name ?? 'Unknown Item',
                    'quantity' => $item->quantity,
                    'unit_price' => (float) $item->unit_price,
                    'total' => (float) ($item->quantity * $item->unit_price),
                    'notes' => $item->notes,
                ];
            }
        }

        return [
            // Business Info
            'business_name' => $businessName,
            'business_address' => $businessAddress,
            'business_phone' => $businessPhone,
            'location_name' => $location?->name,
            
            // Receipt Info
            'receipt_number' => $payment->reference_number,
            'receipt_date' => $payment->completed_at ?? $payment->created_at,
            
            // Order Info
            'order_number' => $order?->order_number,
            'order_type' => $order?->order_type,
            'table_number' => $order?->table?->table_number,
            
            // Customer Info
            'customer_name' => $order?->customer?->user?->full_name,
            'customer_phone' => $order?->customer?->user?->phone,
            
            // Items
            'items' => $items,
            
            // Totals
            'subtotal' => (float) ($invoice?->subtotal ?? 0),
            'tax_amount' => (float) ($invoice?->tax_amount ?? 0),
            'tax_rate' => config('payment.tax_rate', 10),
            'discount_amount' => (float) ($invoice?->discount_amount ?? 0),
            'service_charge' => (float) ($invoice?->service_charge ?? 0),
            'total_amount' => (float) ($invoice?->total_amount ?? $payment->amount),
            
            // Payment Info
            'payment_method' => $payment->paymentMethod?->name ?? 'Unknown',
            'payment_method_code' => $payment->paymentMethod?->code,
            'amount_paid' => (float) $payment->amount,
            'currency' => $payment->currency,
            'transaction_id' => $payment->transaction_id,
            'payment_status' => $payment->status,
            
            // Cash specific
            'cash_received' => $payment->cash_received ? (float) $payment->cash_received : null,
            'change_given' => $payment->change_given ? (float) $payment->change_given : null,
            
            // Footer
            'thank_you_message' => config('payment.receipt.thank_you', 'Thank you for dining with us!'),
            'footer_text' => config('payment.receipt.footer', 'Please come again'),
        ];
    }

    /**
     * Format currency for display.
     */
    public static function formatCurrency(float $amount, string $currency = 'USD'): string
    {
        if (strtoupper($currency) === 'KHR') {
            return '៛' . number_format($amount, 0);
        }
        return '$' . number_format($amount, 2);
    }
}

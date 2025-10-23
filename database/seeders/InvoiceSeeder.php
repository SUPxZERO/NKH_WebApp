<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Invoice;
use App\Models\Order;

class InvoiceSeeder extends Seeder
{
    public function run(): void
    {
        $completedOrders = Order::whereIn('status', ['completed', 'ready'])->get();
        
        foreach ($completedOrders as $order) {
            $invoiceDate = $order->completed_at ?? $order->ordered_at->addMinutes(rand(20, 60));
            $dueDate = $invoiceDate->copy()->addDays(rand(0, 30)); // Some invoices due immediately, others later
            
            Invoice::create([
                'order_id' => $order->id,
                'location_id' => $order->location_id,
                'invoice_number' => $this->generateInvoiceNumber($order),
                'subtotal' => $order->subtotal,
                'tax_amount' => $order->tax_amount,
                'discount_amount' => $order->discount_amount,
                'total_amount' => $order->total_amount,
                'amount_paid' => $this->getAmountPaid($order->total_amount),
                'amount_due' => $this->getAmountDue($order->total_amount),
                'status' => $this->getInvoiceStatus(),
                'issued_at' => $invoiceDate,
                'due_at' => $dueDate,
                'paid_at' => $this->getPaidDate($invoiceDate),
                'notes' => $this->getInvoiceNotes(),
            ]);
        }
    }

    private function generateInvoiceNumber(Order $order): string
    {
        $locationCode = $order->location->code ?? 'NKH';
        $date = ($order->completed_at ?? $order->ordered_at)->format('Ymd');
        $sequence = str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT);
        
        return "INV-{$locationCode}-{$date}-{$sequence}";
    }

    private function getAmountPaid(float $totalAmount): float
    {
        $status = $this->getInvoiceStatus();
        
        switch ($status) {
            case 'paid':
                return $totalAmount;
            case 'issued':
                return 0.00;
            case 'draft':
                return 0.00;
            case 'cancelled':
                return 0.00;
            default:
                return 0.00;
        }
    }

    private function getAmountDue(float $totalAmount): float
    {
        $status = $this->getInvoiceStatus();
        
        switch ($status) {
            case 'paid':
                return 0.00;
            case 'issued':
                return $totalAmount;
            case 'draft':
                return $totalAmount;
            case 'cancelled':
                return 0.00;
            default:
                return 0.00;
        }
    }

    private function getInvoiceStatus(): string
    {
        $random = rand(1, 100);
        
        if ($random <= 60) return 'paid';
        if ($random <= 80) return 'issued';
        if ($random <= 95) return 'draft';
        return 'cancelled';
    }

    private function getPaidDate($invoiceDate): ?string
    {
        $status = $this->getInvoiceStatus();
        
        switch ($status) {
            case 'paid':
                return $invoiceDate->copy()->addMinutes(rand(10, 60))->format('Y-m-d H:i:s');
            case 'issued':
            case 'draft':
            case 'cancelled':
            default:
                return null;
        }
    }

    private function getInvoiceNotes(): ?string
    {
        $notes = [
            null, null, null, null, // 40% no notes
            'Thank you for dining with us!',
            'Payment due within 30 days',
            'Corporate account - NET 30',
            'Catering service invoice',
            'Group booking discount applied',
            'Loyalty points earned: 50',
            'Special event surcharge applied',
            'Early payment discount available',
        ];
        
        return $notes[array_rand($notes)];
    }
}

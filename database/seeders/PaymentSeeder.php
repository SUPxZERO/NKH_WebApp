<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Payment;
use App\Models\Invoice;
use App\Models\PaymentMethod;

class PaymentSeeder extends Seeder
{
    public function run(): void
    {
        $invoices = Invoice::whereIn('status', ['paid', 'partial'])->get();
        $paymentMethods = PaymentMethod::where('is_active', true)->get();
        
        foreach ($invoices as $invoice) {
            if ($invoice->amount_paid > 0) {
                $this->createPaymentsForInvoice($invoice, $paymentMethods);
            }
        }
    }

    private function createPaymentsForInvoice(Invoice $invoice, $paymentMethods): void
    {
        $remainingAmount = $invoice->amount_paid;
        $paymentCount = $invoice->status === 'partial' ? rand(1, 2) : 1;
        
        for ($i = 0; $i < $paymentCount && $remainingAmount > 0; $i++) {
            $paymentMethod = $paymentMethods->random();
            $paymentAmount = $i === $paymentCount - 1 
                ? $remainingAmount 
                : round($remainingAmount * rand(30, 70) / 100, 2);
            
            $paymentDate = $this->getPaymentDate($invoice);
            
            Payment::create([
                'invoice_id' => $invoice->id,
                'payment_method_id' => $paymentMethod->id,
                'amount' => $paymentAmount,
                'transaction_id' => $this->generateTransactionId($paymentMethod),
                'reference_number' => $this->generateReferenceNumber(),
                'status' => $this->getPaymentStatus(),
                'processed_at' => $paymentDate,
                'notes' => $this->getPaymentNotes($paymentMethod),
            ]);
            
            $remainingAmount -= $paymentAmount;
        }
    }

    private function getPaymentDate(Invoice $invoice): string
    {
        $invoiceDate = $invoice->issued_at;
        $paidDate = $invoice->paid_at;
        
        if ($paidDate) {
            return $paidDate;
        }
        
        // Random date between invoice date and now
        $startTimestamp = strtotime($invoiceDate);
        $endTimestamp = time();
        $randomTimestamp = rand($startTimestamp, $endTimestamp);
        
        return date('Y-m-d H:i:s', $randomTimestamp);
    }

    private function generateTransactionId(PaymentMethod $paymentMethod): string
    {
        $prefix = match($paymentMethod->type) {
            'cash' => 'CASH',
            'card' => 'CARD',
            'digital' => 'DIGI',
            'transfer' => 'BANK',
            'voucher' => 'GIFT',
            default => 'PAY',
        };
        
        return $prefix . '-' . strtoupper(uniqid());
    }

    private function generateReferenceNumber(): string
    {
        return 'REF-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    }

    private function getPaymentStatus(): string
    {
        $statuses = ['completed', 'completed', 'completed', 'completed', 'pending', 'failed'];
        return $statuses[array_rand($statuses)];
    }

    private function getPaymentNotes(PaymentMethod $paymentMethod): ?string
    {
        $notes = [
            null, null, null, // 30% no notes
            'Payment processed successfully',
            'Automatic payment',
            'Manual entry by cashier',
            'Split payment',
            'Refund processed',
            'Payment verification required',
            'Corporate payment',
            'Gift card redemption',
        ];
        
        if ($paymentMethod->name === 'Cash') {
            $cashNotes = [null, 'Exact change', 'Change given', 'Tips included'];
            return $cashNotes[array_rand($cashNotes)];
        }
        
        return $notes[array_rand($notes)];
    }
}

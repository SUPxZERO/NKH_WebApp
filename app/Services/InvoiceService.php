<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Payment;
use App\Services\SequenceService;
use Illuminate\Support\Facades\DB;

class InvoiceService
{
    /**
     * Recalculate invoice financial state from its payments and update status/amounts.
     *
     * AUDIT FIX: Wrapped in DB::transaction to ensure invoice and order status
     * updates are atomic. Without this, a crash between the two saves would leave
     * the invoice and order with inconsistent payment statuses.
     */
    public function reconcileStatus(Invoice $invoice): void
    {
        DB::transaction(function () use ($invoice) {
            $completedTotal = $invoice->payments()
                ->whereHas('paymentStatus', function ($q) {
                    $q->where('code', Payment::STATUS_COMPLETED);
                })
                ->sum('amount');

            $total = (float) $invoice->total_amount;
            $tolerance = 0.01;

            if ($total < 0) {
                $total = 0.0;
            }

            if (abs($completedTotal - $total) <= $tolerance && $total > 0) {
                $status = 'paid';
            } elseif ($completedTotal > $total + $tolerance) {
                $status = 'overpaid';
            } elseif ($completedTotal > 0 && $completedTotal < $total - $tolerance) {
                $status = 'partial';
            } else {
                // Keep existing status for cases like draft/issued/cancelled with no payments
                $status = $invoice->status ?? 'draft';
            }

            $invoice->forceFill([
                'amount_paid' => $completedTotal,
                'amount_due' => max(0, $total - $completedTotal),
                'status' => $status,
                'paid_at' => $status === 'paid' ? now() : $invoice->paid_at,
            ])->save();

            // Sync order.payment_status as a projection (inside same transaction)
            if ($invoice->relationLoaded('order') || $invoice->order) {
                $order = $invoice->order;

                $orderPaymentStatus = match ($status) {
                    'paid' => 'paid',
                    'partial' => 'partial',
                    'refunded' => 'refunded',
                    default => 'unpaid',
                };

                $order->forceFill([
                    'payment_status' => $orderPaymentStatus,
                ])->save();
            }
        });
    }
    /**
     * Create or update an invoice for a given order.
     */
    public function createOrUpdateForOrder(\App\Models\Order $order): Invoice
    {
        $invoice = $order->invoice;

        if (!$invoice) {
            $invoice = (new Invoice())->forceFill([
                'order_id' => $order->id,
                'location_id' => $order->location_id,
                'subtotal' => $order->subtotal ?? 0,
                'tax_amount' => $order->tax_amount ?? 0,
                'discount_amount' => $order->discount_amount ?? 0,
                'service_charge' => $order->service_charge ?? 0,
                'total_amount' => $order->total_amount ?? 0,
                'amount_paid' => 0,
                'amount_due' => $order->total_amount ?? 0, // Initially all due
                'currency' => $order->currency ?? 'USD',
                'issued_at' => now(),
                'status' => 'issued', // Default status - can accept payments
                'invoice_number' => $this->generateInvoiceNumber($order->location_id ?? 1),
            ]);
            $invoice->save();
        } else {
            // Update existing invoice amounts if order changed (assuming we want to sync)
            // But be careful not to reset paid amounts if we just want to update totals
            // For now, let's just ensure it exists or update totals if it's draft/issued
            if ($invoice->status !== 'paid' && $invoice->status !== 'void') {
                $invoice->update([
                    'subtotal' => $order->subtotal,
                    'tax_amount' => $order->tax_amount,
                    'discount_amount' => $order->discount_amount,
                    'service_charge' => $order->service_charge,
                    'total_amount' => $order->total_amount,
                    'amount_due' => max(0, $order->total_amount - $invoice->amount_paid),
                ]);
            }
        }

        return $invoice;
    }

    /**
     * Generate a unique invoice number.
     */
    public function generateInvoiceNumber(int $locationId, string $prefix = 'INV'): string
    {
        for ($i = 0; $i < 5; $i++) {
            $number = sprintf('%s-%s-%s', $prefix, now()->format('Ymd'), \Illuminate\Support\Str::upper(\Illuminate\Support\Str::random(5)));
            $exists = Invoice::where('location_id', $locationId)->where('invoice_number', $number)->exists();
            if (!$exists)
                return $number;
        }
        return sprintf('%s-%s-%s', $prefix, now()->format('YmdHis'), random_int(100, 999));
    }
}

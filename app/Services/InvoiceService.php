<?php

namespace App\Services;

use App\Models\Invoice;

class InvoiceService
{
    /**
     * Recalculate invoice financial state from its payments and update status/amounts.
     */
    public function reconcileStatus(Invoice $invoice): void
    {
        $completedTotal = $invoice->payments()
            ->where('status', 'completed')
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
            'amount_due'  => max(0, $total - $completedTotal),
            'status'      => $status,
            'paid_at'     => $status === 'paid' ? now() : $invoice->paid_at,
        ])->save();

        // Optionally sync order.payment_status as a projection
        if ($invoice->relationLoaded('order') || $invoice->order) {
            $order = $invoice->order;

            $orderPaymentStatus = match ($status) {
                'paid'     => 'paid',
                'partial'  => 'partial',
                'refunded' => 'refunded',
                default    => 'unpaid',
            };

            $order->forceFill([
                'payment_status' => $orderPaymentStatus,
            ])->save();
        }
    }
}

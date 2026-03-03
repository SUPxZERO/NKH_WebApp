<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Payment;
use App\Services\SequenceService;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class InvoiceService
{
    /**
     * Helper to load legacy nested JSON translations into the translator
     * so that standard dot-notation keys work (e.g. __('finance.invoices.title'))
     */
    public function loadNestedJsonTranslations()
    {
        $locale = app()->getLocale();
        $path = lang_path("{$locale}.json");

        if (file_exists($path)) {
            $json = json_decode(file_get_contents($path), true);
            if ($json) {
                // Flatten the nested array so Laravel's translator can find keys like 'a.b.c'
                $flat = \Illuminate\Support\Arr::dot($json);
                app('translator')->addLines($flat, $locale);
            }
        }
    }

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

    /**
     * Prepare data needed for Invoice PDF generation.
     */
    public function generatePdfData(Invoice $invoice): array
    {
        $this->loadNestedJsonTranslations();
        $invoice->loadMissing(['order.items.menuItem', 'order.customer.user', 'location']);

        return [
            'invoice_number' => $invoice->invoice_number ?? 'INV-' . $invoice->id,
            'issued_date' => $invoice->issued_at ? $invoice->issued_at->format('M d, Y') : date('M d, Y'),
            'company_name' => config('app.name'),
            'company_address' => $invoice->location->address ?? 'Main Branch',
            'company_phone' => $invoice->location->phone ?? '',
            'customer_name' => $invoice->order ? ($invoice->order->customer?->user?->name
                ?? $invoice->order->customer?->name
                ?? 'Guest') : 'Guest',
            'customer_email' => $invoice->order ? ($invoice->order->customer?->user?->email
                ?? $invoice->order->customer?->email
                ?? '') : '',
            'customer_phone' => $invoice->order ? ($invoice->order->customer?->user?->phone
                ?? $invoice->order->customer?->phone
                ?? '') : '',
            'order_ref' => $invoice->order ? ($invoice->order->order_number ?? '') : '',
            'items' => ($invoice->order && $invoice->order->items) ? $invoice->order->items->map(function ($item) {
                return [
                    'name' => $item->menuItem->name ?? 'Item',
                    'quantity' => $item->quantity,
                    'price' => $item->unit_price,
                    'total' => $item->subtotal,
                    'notes' => $item->notes,
                ];
            }) : collect([]),
            'subtotal' => $invoice->subtotal,
            'tax' => $invoice->tax_total,
            'discount' => $invoice->discount_total,
            'total' => $invoice->total,
            'amount_due' => $invoice->amount_due,
            'status' => (float) $invoice->amount_due <= 0 ? 'paid' : ($invoice->amount_paid > 0 ? 'partial' : 'unpaid'),
            'currency' => '$', // Or fetch from config
        ];
    }

    /**
     * Retrieve global invoices based on request filters for CSV export.
     */
    public function getFilteredInvoicesForCsv(Request $request)
    {
        $this->loadNestedJsonTranslations();

        $query = Invoice::with([
            'order.customer.user',
            'order.customer.telegramUser',
            'location'
        ]);

        // Filter by date range
        if ($request->has('start_date')) {
            $query->whereDate('issued_at', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->whereDate('issued_at', '<=', $request->end_date);
        }

        // Filter by payment status
        if ($request->has('status')) {
            if ($request->status === 'paid') {
                $query->where('amount_due', '<=', 0);
            } elseif ($request->status === 'unpaid') {
                $query->where('amount_due', '>', 0)->where('amount_paid', '=', 0);
            } elseif ($request->status === 'partial') {
                $query->where('amount_due', '>', 0)->where('amount_paid', '>', 0);
            }
        }

        return $query->orderBy('issued_at', 'desc')->get();
    }

    /**
     * Generate the CSV Stream callback for a collection of invoices.
     */
    public function generateCsvStream($invoices): \Closure
    {
        return function () use ($invoices) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF)); // Add BOM for UTF-8 compatibility
            fputcsv($file, [
                __('finance.invoices.table.invoice_no'),
                __('finance.invoices.table.issued_date'),
                __('finance.invoices.table.customer'),
                __('finance.invoices.table.amount'),
                __('finance.invoices.table.paid_amount'),
                __('finance.invoices.table.due'),
                __('finance.invoices.table.status')
            ]);

            foreach ($invoices as $invoice) {
                fputcsv($file, [
                    $invoice->invoice_number,
                    $invoice->issued_at ? $invoice->issued_at->format('Y-m-d') : '',
                    $invoice->order->customer?->user?->name ?? $invoice->order->customer?->name ?? 'Guest',
                    $invoice->total,
                    $invoice->amount_paid,
                    $invoice->amount_due,
                    $invoice->amount_due <= 0 ? __('finance.invoices.status.paid') : ($invoice->amount_paid > 0 ? __('finance.invoices.status.partial') : __('finance.invoices.status.unpaid'))
                ]);
            }
            fclose($file);
        };
    }

    /**
     * Generate a CSV Stream callback for a single invoice representation.
     */
    public function generateSingleInvoiceCsvStream(Invoice $invoice): \Closure
    {
        $this->loadNestedJsonTranslations();
        $invoice->loadMissing(['order.items.menuItem', 'order.customer.user', 'location']);

        return function () use ($invoice) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF)); // Add BOM for UTF-8 compatibility

            // Header Info
            fputcsv($file, [__('finance.invoices.modal.title')]);
            fputcsv($file, [__('finance.invoices.modal.invoice_number'), $invoice->invoice_number]);
            fputcsv($file, [__('finance.invoices.modal.date_issued'), $invoice->issued_at ? $invoice->issued_at->format('Y-m-d') : __('finance.invoices.na')]);
            fputcsv($file, [__('finance.invoices.pdf.due'), $invoice->due_date ? $invoice->due_date->format('Y-m-d') : __('finance.invoices.na')]);
            fputcsv($file, [__('finance.invoices.table.customer'), $invoice->order->customer->user->name ?? __('common.unknown')]);
            fputcsv($file, []);

            // Items
            fputcsv($file, [__('common.items')]);
            fputcsv($file, [
                __('finance.invoices.pdf.description'),
                __('finance.invoices.pdf.quantity'),
                __('finance.invoices.pdf.unit_price'),
                __('finance.invoices.pdf.total')
            ]);

            if ($invoice->order && $invoice->order->items) {
                foreach ($invoice->order->items as $item) {
                    fputcsv($file, [
                        $item->menuItem ? $item->menuItem->name : 'Unknown Item',
                        $item->quantity,
                        $item->price,
                        $item->total_price
                    ]);
                }
            }
            fputcsv($file, []);

            // Totals
            fputcsv($file, [__('finance.invoices.modal.financials')]);
            fputcsv($file, [__('finance.invoices.modal.subtotal'), $invoice->subtotal]);
            fputcsv($file, [__('finance.invoices.modal.tax'), $invoice->tax_total]);
            fputcsv($file, [__('finance.invoices.modal.total'), $invoice->total]);
            fputcsv($file, [__('finance.invoices.table.paid_amount'), $invoice->amount_paid]);
            fputcsv($file, [__('finance.invoices.table.due'), $invoice->amount_due]);
            fputcsv($file, [__('finance.invoices.table.status'), $invoice->amount_due <= 0 ? __('finance.invoices.status.paid') : __('finance.invoices.status.unpaid')]);

            fclose($file);
        };
    }
}

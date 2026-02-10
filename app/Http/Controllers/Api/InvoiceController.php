<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class InvoiceController extends Controller
{
    /**
     * Helper to load legacy nested JSON translations into the translator
     * so that standard dot-notation keys work (e.g. __('finance.invoices.title'))
     */
    private function loadNestedJsonTranslations()
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

    public function index(Request $request)
    {
        $query = Invoice::with([
            'order.customer.user',
            'order.customer.telegramUser',
            'location',
            'payments'
        ]);

        // Filter by date range
        if ($request->has('start_date')) {
            $query->whereDate('issued_at', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->whereDate('issued_at', '<=', $request->end_date);
        }

        // Filter by location
        if ($request->has('location_id')) {
            $query->where('location_id', $request->location_id);
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

        // Search by invoice number
        if ($request->has('search')) {
            $query->where('invoice_number', 'like', '%' . $request->search . '%');
        }

        $invoices = $query->orderBy('issued_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return InvoiceResource::collection($invoices);
    }

    public function show(Invoice $invoice): InvoiceResource
    {
        return new InvoiceResource($invoice->load(['order.items.menuItem', 'order.customer.user', 'location', 'payments']));
    }

    public function downloadPdf(Request $request, Invoice $invoice)
    {
        if ($request->has('locale') && in_array($request->input('locale'), ['en', 'km'])) {
            app()->setLocale($request->input('locale'));
            \Carbon\Carbon::setLocale($request->input('locale'));
        }
        $this->loadNestedJsonTranslations();

        $invoice->load(['order.items.menuItem', 'order.customer.user', 'location']);

        $data = [
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

        $filename = 'Invoice-' . ($invoice->invoice_number ?? $invoice->id) . '.pdf';
        $pdfContent = app(\App\Services\PdfService::class)->generate('invoices.pdf', $data);

        return response($pdfContent)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    public function exportCsv(Request $request)
    {
        if ($request->has('locale') && in_array($request->input('locale'), ['en', 'km'])) {
            app()->setLocale($request->input('locale'));
            \Carbon\Carbon::setLocale($request->input('locale'));
        }
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

        $invoices = $query->orderBy('issued_at', 'desc')->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="invoices-export-' . date('Y-m-d') . '.csv"',
        ];

        $callback = function () use ($invoices) {
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

        return response()->stream($callback, 200, $headers);
    }

    public function exportShowCsv(Request $request, Invoice $invoice)
    {
        if ($request->has('locale') && in_array($request->input('locale'), ['en', 'km'])) {
            app()->setLocale($request->input('locale'));
            \Carbon\Carbon::setLocale($request->input('locale'));
        }
        $this->loadNestedJsonTranslations();

        $invoice->load(['order.items.menuItem', 'order.customer.user', 'location']);

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="invoice-' . $invoice->invoice_number . '.csv"',
        ];

        $callback = function () use ($invoice) {
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

        return response()->stream($callback, 200, $headers);
    }
}

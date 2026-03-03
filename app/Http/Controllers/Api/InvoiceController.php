<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

use App\Services\InvoiceService;

class InvoiceController extends Controller
{

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

    public function downloadPdf(Request $request, Invoice $invoice, InvoiceService $invoiceService)
    {
        if ($request->has('locale') && in_array($request->input('locale'), ['en', 'km'])) {
            app()->setLocale($request->input('locale'));
            \Carbon\Carbon::setLocale($request->input('locale'));
        }

        $data = $invoiceService->generatePdfData($invoice);

        $filename = 'Invoice-' . ($invoice->invoice_number ?? $invoice->id) . '.pdf';
        $pdfContent = app(\App\Services\PdfService::class)->generate('invoices.pdf', $data);

        return response($pdfContent)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    public function exportCsv(Request $request, InvoiceService $invoiceService)
    {
        if ($request->has('locale') && in_array($request->input('locale'), ['en', 'km'])) {
            app()->setLocale($request->input('locale'));
            \Carbon\Carbon::setLocale($request->input('locale'));
        }

        $invoices = $invoiceService->getFilteredInvoicesForCsv($request);

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="invoices-export-' . date('Y-m-d') . '.csv"',
        ];

        $callback = $invoiceService->generateCsvStream($invoices);

        return response()->stream($callback, 200, $headers);
    }

    public function exportShowCsv(Request $request, Invoice $invoice, InvoiceService $invoiceService)
    {
        if ($request->has('locale') && in_array($request->input('locale'), ['en', 'km'])) {
            app()->setLocale($request->input('locale'));
            \Carbon\Carbon::setLocale($request->input('locale'));
        }

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="invoice-' . $invoice->invoice_number . '.csv"',
        ];

        $callback = $invoiceService->generateSingleInvoiceCsvStream($invoice);

        return response()->stream($callback, 200, $headers);
    }
}

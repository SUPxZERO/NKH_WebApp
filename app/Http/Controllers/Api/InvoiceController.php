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
    public function index(Request $request)
    {
        $query = Invoice::with(['order.customer.user', 'location', 'payments']);
        
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

    public function downloadPdf(Invoice $invoice)
    {
        $invoice->load(['order.items.menuItem', 'order.customer.user', 'location']);

        $data = [
            'invoice_number' => $invoice->invoice_number ?? 'INV-' . $invoice->id,
            'issued_date' => $invoice->issued_at ? $invoice->issued_at->format('M d, Y') : date('M d, Y'),
            'company_name' => config('app.name'),
            'company_address' => $invoice->location->address ?? 'Main Branch',
            'company_phone' => $invoice->location->phone ?? '',
            'customer_name' => $invoice->order->customer->user->name ?? 'Guest',
            'customer_email' => $invoice->order->customer->user->email ?? '',
            'customer_phone' => $invoice->order->customer->user->phone ?? '',
            'order_ref' => $invoice->order->order_number ?? '',
            'items' => $invoice->order->items->map(function ($item) {
                return [
                    'name' => $item->menuItem->name ?? 'Item',
                    'quantity' => $item->quantity,
                    'price' => $item->unit_price,
                    'total' => $item->subtotal,
                    'notes' => $item->notes,
                ];
            }),
            'subtotal' => $invoice->subtotal,
            'tax' => $invoice->tax_total,
            'discount' => $invoice->discount_total,
            'total' => $invoice->total,
            'amount_due' => $invoice->amount_due,
            'status' => $invoice->amount_due <= 0 ? 'paid' : ($invoice->amount_paid > 0 ? 'partial' : 'unpaid'),
            'currency' => '$', // Or fetch from config
        ];

        $pdf = Pdf::loadView('invoices.pdf', $data);
        
        $pdf = Pdf::loadView('invoices.pdf', $data);
        
        return $pdf->download('Invoice-' . ($invoice->invoice_number ?? $invoice->id) . '.pdf');
    }

    public function exportCsv(Request $request)
    {
        $query = Invoice::with(['order.customer.user', 'location']);

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

        $callback = function() use ($invoices) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Invoice Number', 'Date', 'Customer', 'Total', 'Paid', 'Due', 'Status']);

            foreach ($invoices as $invoice) {
                fputcsv($file, [
                    $invoice->invoice_number,
                    $invoice->issued_at ? $invoice->issued_at->format('Y-m-d') : '',
                    $invoice->order->customer->user->name ?? 'Guest',
                    $invoice->total,
                    $invoice->amount_paid,
                    $invoice->amount_due,
                    $invoice->amount_due <= 0 ? 'Paid' : ($invoice->amount_paid > 0 ? 'Partial' : 'Unpaid')
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function exportShowCsv(Invoice $invoice)
    {
        $invoice->load(['order.items.menuItem', 'order.customer.user', 'location']);
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="invoice-' . $invoice->invoice_number . '.csv"',
        ];

        $callback = function() use ($invoice) {
            $file = fopen('php://output', 'w');
            
            // Header Info
            fputcsv($file, ['INVOICE DETAIL']);
            fputcsv($file, ['Invoice Number', $invoice->invoice_number]);
            fputcsv($file, ['Date Issued', $invoice->issued_at ? $invoice->issued_at->format('Y-m-d') : 'N/A']);
            fputcsv($file, ['Due Date', $invoice->due_date ? $invoice->due_date->format('Y-m-d') : 'N/A']);
            fputcsv($file, ['Customer', $invoice->order->customer->user->name ?? 'Guest']);
            fputcsv($file, []);

            // Items
            fputcsv($file, ['ITEMS']);
            fputcsv($file, ['Item Name', 'Quantity', 'Unit Price', 'Total']);
            
            if ($invoice->order && $invoice->order->items) {
                foreach ($invoice->order->items as $item) {
                     fputcsv($file, [
                         $item->menuItem ? $item->menuItem->translation->name ?? $item->menu_item_id : 'Unknown Item',
                         $item->quantity,
                         $item->price,
                         $item->total_price
                     ]);
                }
            }
            fputcsv($file, []);

            // Totals
            fputcsv($file, ['SUMMARY']);
            fputcsv($file, ['Subtotal', $invoice->subtotal]);
            fputcsv($file, ['Tax', $invoice->tax_total]);
            fputcsv($file, ['Total Amount', $invoice->total]);
            fputcsv($file, ['Amount Paid', $invoice->amount_paid]);
            fputcsv($file, ['Amount Due', $invoice->amount_due]);
            fputcsv($file, ['Status', $invoice->amount_due <= 0 ? 'Paid' : 'Unpaid']);

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}

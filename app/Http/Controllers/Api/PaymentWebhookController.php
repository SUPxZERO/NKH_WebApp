<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\InvoiceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentWebhookController extends Controller
{
    /**
     * Handle successful payment callbacks from an external provider.
     *
     * NOTE: In production, protect this endpoint with proper signature
     * verification and IP allow-listing.
     */
    public function handleSuccess(Request $request, InvoiceService $invoiceService)
    {
        $validated = $request->validate([
            'transaction_id' => ['required', 'string'],
        ]);

        DB::transaction(function () use ($validated, $invoiceService) {
            $payment = Payment::where('transaction_id', $validated['transaction_id'])
                ->lockForUpdate()
                ->firstOrFail();

            $payment->forceFill([
                'status' => 'completed',
                'processed_at' => now(),
            ])->save();

            $invoice = $payment->invoice()->lockForUpdate()->firstOrFail();
            $invoice->loadMissing('payments', 'order');

            $invoiceService->reconcileStatus($invoice);
        });

        return response()->json(['ok' => true]);
    }
}

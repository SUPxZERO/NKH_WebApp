<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\PaymentReceiptMail;
use App\Models\Payment;
use App\Services\ReceiptService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class ReceiptController extends Controller
{
    protected ReceiptService $receiptService;

    public function __construct(ReceiptService $receiptService)
    {
        $this->receiptService = $receiptService;
    }

    /**
     * Get receipt data as JSON.
     * 
     * GET /api/receipts/{payment}
     */
    public function show(Payment $payment): JsonResponse
    {
        $data = $this->receiptService->getReceiptData($payment);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Download receipt as PDF.
     * 
     * GET /api/receipts/{payment}/pdf
     */
    public function downloadPdf(Payment $payment): Response|JsonResponse
    {
        try {
            $pdfPath = $this->receiptService->generatePdf($payment);
            
            if (!Storage::disk('public')->exists($pdfPath)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Failed to generate PDF',
                ], 500);
            }

            $filename = 'receipt_' . $payment->reference_number . '.pdf';
            
            return response(Storage::disk('public')->get($pdfPath), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to generate PDF: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * View receipt as HTML.
     * 
     * GET /api/receipts/{payment}/html
     */
    public function viewHtml(Payment $payment): Response
    {
        $html = $this->receiptService->generateHtml($payment);
        
        return response($html, 200, [
            'Content-Type' => 'text/html',
        ]);
    }

    /**
     * Get thermal receipt HTML.
     * 
     * GET /api/receipts/{payment}/thermal
     */
    public function thermal(Payment $payment): Response
    {
        $html = $this->receiptService->generateThermalReceipt($payment);
        
        return response($html, 200, [
            'Content-Type' => 'text/html',
        ]);
    }

    /**
     * Send receipt via email.
     * 
     * POST /api/receipts/{payment}/email
     */
    public function sendEmail(Request $request, Payment $payment): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'attach_pdf' => 'boolean',
        ]);

        $email = $validated['email'];
        $attachPdf = $validated['attach_pdf'] ?? true;

        try {
            Mail::to($email)->queue(new PaymentReceiptMail($payment, $attachPdf));

            return response()->json([
                'success' => true,
                'message' => "Receipt sent to {$email}",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to send email: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get receipt by payment UUID.
     * 
     * GET /api/receipts/uuid/{uuid}
     */
    public function showByUuid(string $uuid): JsonResponse
    {
        $payment = Payment::where('uuid', $uuid)->first();

        if (!$payment) {
            return response()->json([
                'success' => false,
                'error' => 'Payment not found',
            ], 404);
        }

        return $this->show($payment);
    }

    /**
     * Print receipt (returns print-ready HTML).
     * 
     * GET /api/receipts/{payment}/print
     */
    public function print(Payment $payment, Request $request): Response
    {
        $format = $request->get('format', 'standard');
        
        if ($format === 'thermal') {
            $html = $this->receiptService->generateThermalReceipt($payment);
        } else {
            $html = $this->receiptService->generateHtml($payment);
        }

        // Add print script
        $printScript = <<<HTML
        <script>
            window.onload = function() {
                window.print();
            };
        </script>
        HTML;

        $html = str_replace('</body>', $printScript . '</body>', $html);
        
        return response($html, 200, [
            'Content-Type' => 'text/html',
        ]);
    }
}

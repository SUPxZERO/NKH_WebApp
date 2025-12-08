<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentAuditLog;
use App\Models\PaymentMethod;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class PaymentService
{
    protected PaymentReferenceGenerator $referenceGenerator;
    protected QrCodeGenerator $qrGenerator;
    protected InvoiceService $invoiceService;
    protected FraudDetectionService $fraudDetection;

    public function __construct(
        PaymentReferenceGenerator $referenceGenerator,
        QrCodeGenerator $qrGenerator,
        InvoiceService $invoiceService,

        FraudDetectionService $fraudDetection,
        protected LoyaltyService $loyaltyService
    ) {
        $this->referenceGenerator = $referenceGenerator;
        $this->qrGenerator = $qrGenerator;
        $this->invoiceService = $invoiceService;
        $this->fraudDetection = $fraudDetection;
        $this->loyaltyService = $loyaltyService;
    }

    /**
     * Initiate a payment for an order.
     */
    public function initiatePayment(Order $order, string $paymentMethodCode = 'qr'): array
    {
        return DB::transaction(function () use ($order, $paymentMethodCode) {
            // Ensure invoice exists
            $invoice = $order->invoice;
            if (!$invoice) {
                $invoice = $this->createInvoiceForOrder($order);
            }

            // Get payment method
            $paymentMethod = PaymentMethod::where('code', $paymentMethodCode)
                ->where('is_active', true)
                ->first();

            if (!$paymentMethod) {
                throw new \Exception("Payment method '{$paymentMethodCode}' not available");
            }

            // Check for duplicate pending payment
            $existingPayment = Payment::where('invoice_id', $invoice->id)
                ->pending()
                ->where('expires_at', '>', now())
                ->first();

            if ($existingPayment) {
                return $this->formatPaymentResponse($existingPayment, $order);
            }

            // Generate references
            $referenceNumber = $this->referenceGenerator->generate($order);
            $transactionId = $this->referenceGenerator->generateTransactionId();
            $qrReference = $this->referenceGenerator->generateQrReference();

            // Create payment record
            $payment = Payment::create([
                'invoice_id' => $invoice->id,
                'payment_method_id' => $paymentMethod->id,
                'amount' => $invoice->amount_due,
                'currency' => $invoice->currency ?? 'USD',
                'transaction_id' => $transactionId,
                'reference_number' => $referenceNumber,
                'qr_reference' => $qrReference,
                'status' => Payment::STATUS_PENDING,
                'expires_at' => now()->addMinutes(config('payment.expiry_minutes', 15)),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'device_fingerprint' => request()->header('X-Device-Fingerprint'),
            ]);

            // Run fraud detection check
            $fraudCheck = $this->fraudDetection->checkPayment($payment, [
                'ip' => request()->ip(),
                'fingerprint' => request()->header('X-Device-Fingerprint'),
            ]);

            if (!$fraudCheck['passed']) {
                $payment->update([
                    'status' => Payment::STATUS_FAILED,
                    'failure_reason' => 'Fraud detection: ' . implode(', ', $fraudCheck['reasons']),
                ]);

                PaymentAuditLog::log($payment, 'fraud_blocked', Payment::STATUS_PENDING, Payment::STATUS_FAILED, null, $fraudCheck);

                throw new \Exception('Payment blocked by security check. Please contact support.');
            }

            // Log payment initiation
            PaymentAuditLog::log($payment, 'initiated', null, Payment::STATUS_PENDING, null, [
                'order_id' => $order->id,
                'payment_method' => $paymentMethodCode,
                'fraud_score' => $fraudCheck['score'],
            ]);

            return $this->formatPaymentResponse($payment, $order);
        });
    }

    /**
     * Get payment status with QR code data.
     */
    public function getPaymentStatus(Payment $payment): array
    {
        $payment->load(['invoice.order', 'paymentMethod']);
        
        $response = [
            'payment_id' => $payment->id,
            'uuid' => $payment->uuid,
            'status' => $payment->status,
            'amount' => (float) $payment->amount,
            'currency' => $payment->currency,
            'reference_number' => $payment->reference_number,
            'transaction_id' => $payment->transaction_id,
            'created_at' => $payment->created_at->toIso8601String(),
            'expires_at' => $payment->expires_at?->toIso8601String(),
            'is_expired' => $payment->isExpired(),
        ];

        if ($payment->isCompleted()) {
            $response['processed_at'] = $payment->processed_at?->toIso8601String();
        }

        if ($payment->isFailed()) {
            $response['failure_reason'] = $payment->failure_reason;
            $response['can_retry'] = $payment->canRetry();
        }

        return $response;
    }

    /**
     * Process webhook callback (payment confirmation).
     */
    public function processWebhook(array $webhookData): Payment
    {
        return DB::transaction(function () use ($webhookData) {
            // Find payment by reference
            $payment = $this->findPaymentByWebhook($webhookData);
            
            if (!$payment) {
                throw new \Exception('Payment not found for webhook data');
            }

            // Lock for update to prevent race conditions
            $payment = Payment::where('id', $payment->id)
                ->lockForUpdate()
                ->first();

            // Verify payment is still pending
            if (!$payment->isPending()) {
                Log::info('Webhook received for already processed payment', [
                    'payment_id' => $payment->id,
                    'status' => $payment->status,
                ]);
                return $payment;
            }

            $oldStatus = $payment->status;
            $success = $webhookData['status'] === 'success' || $webhookData['status'] === 'completed';

            if ($success) {
                $this->handleSuccessfulPayment($payment, $webhookData);
            } else {
                $this->handleFailedPayment($payment, $webhookData);
            }

            // Log webhook processing
            PaymentAuditLog::logWebhook(
                $payment,
                'webhook_processed',
                $oldStatus,
                $payment->status,
                $webhookData
            );

            return $payment->fresh();
        });
    }

    /**
     * Cancel a pending payment.
     */
    public function cancelPayment(Payment $payment, string $reason = 'User cancelled'): bool
    {
        if (!$payment->isPending()) {
            return false;
        }

        $payment->markAsCancelled();
        
        PaymentAuditLog::log($payment, 'cancelled', $payment->status, Payment::STATUS_CANCELLED, null, [
            'reason' => $reason,
        ]);

        return true;
    }

    /**
     * Retry a failed payment.
     */
    public function retryPayment(Payment $payment): array
    {
        if (!$payment->canRetry()) {
            throw new \Exception('Payment cannot be retried');
        }

        $order = $payment->invoice->order;
        
        // Cancel old payment
        $payment->markAsCancelled();

        // Create new payment
        return $this->initiatePayment($order, $payment->paymentMethod->code ?? 'qr');
    }

    /**
     * Expire old pending payments.
     */
    public function expireOldPayments(): int
    {
        $expiredPayments = Payment::expired()->get();

        foreach ($expiredPayments as $payment) {
            $payment->update([
                'status' => Payment::STATUS_CANCELLED,
                'failure_reason' => 'Payment expired',
            ]);

            PaymentAuditLog::log($payment, 'expired', Payment::STATUS_PENDING, Payment::STATUS_CANCELLED);
        }

        return $expiredPayments->count();
    }

    // ==================== PRIVATE METHODS ====================

    private function createInvoiceForOrder(Order $order): Invoice
    {
        return Invoice::create([
            'order_id' => $order->id,
            'location_id' => $order->location_id,
            'invoice_number' => 'INV-' . now()->format('ymd') . '-' . str_pad($order->id, 6, '0', STR_PAD_LEFT),
            'subtotal' => $order->subtotal,
            'tax_amount' => $order->tax_amount,
            'discount_amount' => $order->discount_amount,
            'service_charge' => $order->service_charge ?? 0,
            'total_amount' => $order->total_amount,
            'amount_paid' => 0,
            'amount_due' => $order->total_amount,
            'currency' => $order->currency ?? 'USD',
            'status' => 'issued',
            'issued_at' => now(),
        ]);
    }

    private function formatPaymentResponse(Payment $payment, Order $order): array
    {
        $qrData = $this->qrGenerator->generateQrkhData($payment, $order);
        
        return [
            'success' => true,
            'payment' => [
                'id' => $payment->id,
                'uuid' => $payment->uuid,
                'status' => $payment->status,
                'amount' => (float) $payment->amount,
                'currency' => $payment->currency,
                'reference_number' => $payment->reference_number,
                'transaction_id' => $payment->transaction_id,
                'expires_at' => $payment->expires_at?->toIso8601String(),
                'expires_in_seconds' => $payment->expires_at ? now()->diffInSeconds($payment->expires_at, false) : null,
            ],
            'qr_code' => [
                'data' => $qrData['qr_data'],
                'reference' => $qrData['qr_reference'],
                'image_svg' => $this->qrGenerator->generateSvg($qrData['qr_data']),
                'image_base64' => $this->qrGenerator->generateBase64($qrData['qr_data']),
            ],
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'total' => (float) $order->total_amount,
            ],
        ];
    }

    private function findPaymentByWebhook(array $webhookData): ?Payment
    {
        // Try different reference fields
        if (!empty($webhookData['qr_reference'])) {
            return Payment::byQrReference($webhookData['qr_reference'])->first();
        }
        
        if (!empty($webhookData['transaction_id'])) {
            return Payment::where('transaction_id', $webhookData['transaction_id'])->first();
        }
        
        if (!empty($webhookData['reference_number'])) {
            return Payment::where('reference_number', $webhookData['reference_number'])->first();
        }

        return null;
    }

    private function handleSuccessfulPayment(Payment $payment, array $webhookData): void
    {
        $payment->markAsCompleted($webhookData['gateway_reference'] ?? null);
        
        // Update invoice
        $invoice = $payment->invoice;
        $invoice->loadMissing('payments', 'order');

        $this->invoiceService->reconcileStatus($invoice);

        // Award loyalty points
        if ($invoice->order) {
            $this->loyaltyService->awardPoints($invoice->order);
        }
    }

    private function handleFailedPayment(Payment $payment, array $webhookData): void
    {
        $reason = $webhookData['failure_reason'] ?? $webhookData['message'] ?? 'Payment failed';
        $payment->markAsFailed($reason);
    }
}

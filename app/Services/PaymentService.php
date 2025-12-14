<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentAuditLog;
use App\Models\PaymentMethod;
use App\Services\Payment\PaymentStrategyInterface;
use App\Services\Payment\Strategies\QrPaymentStrategy;
use App\Services\Payment\Strategies\CashPaymentStrategy;
use App\Services\Payment\Strategies\CardPaymentStrategy;
use App\Services\Payment\Strategies\StripePaymentStrategy;
use App\Services\Payment\Strategies\AbaPaymentStrategy;
use App\Services\Payment\Strategies\WingPaymentStrategy;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class PaymentService
{
    protected PaymentReferenceGenerator $referenceGenerator;
    protected InvoiceService $invoiceService;
    protected FraudDetectionService $fraudDetection;
    protected LoyaltyService $loyaltyService;

    // Strategy cache
    protected array $strategies = [];

    public function __construct(
        PaymentReferenceGenerator $referenceGenerator,
        InvoiceService $invoiceService,
        FraudDetectionService $fraudDetection,
        LoyaltyService $loyaltyService
    ) {
        $this->referenceGenerator = $referenceGenerator;
        $this->invoiceService = $invoiceService;
        $this->fraudDetection = $fraudDetection;
        $this->loyaltyService = $loyaltyService;
    }

    /**
     * Get the strategy for a specific payment method code.
     */
    protected function getStrategy(string $code): PaymentStrategyInterface
    {
        if (isset($this->strategies[$code])) {
            return $this->strategies[$code];
        }

        $strategy = match ($code) {
            'qr' => app(QrPaymentStrategy::class),
            'cash' => app(CashPaymentStrategy::class),
            'card' => config('services.stripe.secret') ? app(StripePaymentStrategy::class) : app(CardPaymentStrategy::class),
            'aba_pay' => app(AbaPaymentStrategy::class),
            'wing' => app(WingPaymentStrategy::class),
            default => throw new \Exception("Payment strategy for '{$code}' not implemented"),
        };

        $this->strategies[$code] = $strategy;
        return $strategy;
    }

    /**
     * Initiate a payment for an order.
     */
    public function initiatePayment(Order $order, string $paymentMethodCode = 'qr', float $amountToPay = null, string $userId = null, float $tipAmount = 0): array
    {
        return DB::transaction(function () use ($order, $paymentMethodCode, $amountToPay, $userId, $tipAmount) {
            // Ensure invoice exists
            $invoice = $order->invoice;
            if (!$invoice) {
                $invoice = $this->createInvoiceForOrder($order);
            }

            // Get allocation amount (default to full remaining due if not specified)
            $amount = $amountToPay ?? $invoice->amount_due;

            // Get payment method
            $paymentMethod = PaymentMethod::where('code', $paymentMethodCode)
                ->where('is_active', true)
                ->first();
    
            // ... (method retrieval fallback logic remains)
            if (!$paymentMethod) { // Simplified check for brevity in replacement, assuming exists logic is block above or here
                 // RE-INSERTING THE FALLBACK LOGIC TO BE SAFE
                 if ($paymentMethodCode === 'qr') {
                     $paymentMethod = PaymentMethod::firstOrCreate(
                         ['code' => 'qr'], 
                         ['name' => 'KHQR', 'type' => 'digital_wallet', 'is_active' => true, 'display_order' => 1]
                     );
                 } else {
                      throw new \Exception("Payment method '{$paymentMethodCode}' not available or inactive");
                 }
            }

            // Generate references
            $referenceNumber = $this->referenceGenerator->generate($order);
            $transactionId = $this->referenceGenerator->generateTransactionId();
            $qrReference = $this->referenceGenerator->generateQrReference();

            // Create payment record
            $payment = Payment::create([
                'invoice_id' => $invoice->id,
                'payment_method_id' => $paymentMethod->id,
                'amount' => $amount, // Appied to invoice
                'tip' => $tipAmount,  // Tip amount
                'currency' => $invoice->currency ?? 'USD',
                'transaction_id' => $transactionId,
                'reference_number' => $referenceNumber,
                'qr_reference' => $qrReference,
                'status' => Payment::STATUS_PENDING,
                'created_by' => $userId, // Ensure creator is logged
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

            // Delegate initiation logic to strategy
            $strategy = $this->getStrategy($paymentMethodCode);
            $strategy->initiate($order, $payment);

            return $strategy->formatResponse($payment, $order);
        });
    }

    /**
     * Get payment status with QR code data.
     */
    public function getPaymentStatus(Payment $payment): array
    {
        $payment->load(['invoice.order', 'paymentMethod']);
        $order = $payment->invoice->order;
        $methodCode = $payment->paymentMethod->code ?? 'qr';

        try {
            $strategy = $this->getStrategy($methodCode);
            return $strategy->formatResponse($payment, $order);
        } catch (\Exception $e) {
            // Fallback generic response if strategy fails
             return [
                'success' => true,
                'payment' => [
                    'id' => $payment->id,
                    'status' => $payment->status,
                    'amount' => (float) $payment->amount,
                ],
                'error' => 'Could not format full response: ' . $e->getMessage()
            ];
        }
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
        // Wrapper to call the strategy's formatter, ensuring consistent interface usage
        $strategy = $this->getStrategy($payment->paymentMethod->code ?? 'qr');
        return $strategy->formatResponse($payment, $order);
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

        // If this invoice's order is not yet linked to a customer but we have an
        // authenticated customer, attach it so it appears in /customer/orders.
        if ($invoice->order && !$invoice->order->customer_id && auth()->check() && auth()->user()->customer) {
            $order = $invoice->order;
            $order->customer_id = auth()->user()->customer->id;
            $order->save();
        }

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

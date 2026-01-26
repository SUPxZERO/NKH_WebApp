<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Invoice;
use App\Services\InvoiceService;
use App\Services\NotificationService;
use App\Services\LoyaltyService;
use App\Services\TableStatusService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use App\Models\PaymentStatus;
// use App\Models\PaymentAuditLog; // Model does not exist

class PaymentService
{
    protected $invoiceService;
    protected $notificationService;
    protected $loyaltyService;
    protected $inventoryDeductionService;

    public function __construct(
        InvoiceService $invoiceService,
        NotificationService $notificationService,
        LoyaltyService $loyaltyService,
        InventoryDeductionService $inventoryDeductionService
    ) {
        $this->invoiceService = $invoiceService;
        $this->notificationService = $notificationService;
        $this->loyaltyService = $loyaltyService;
        $this->inventoryDeductionService = $inventoryDeductionService;
    }

    /**
     * Initiate a payment via a gateway or method.
     * 
     * @param Order $order The order to pay for
     * @param string $methodCode Payment method code (cash, card, qr, etc)
     * @param float|null $amount Optional partial payment amount (defaults to full invoice amount)
     * @param int|null $processedByUserId User processing the payment (for audit)
     * @param float $tip Optional tip amount to add
     */
    public function initiatePayment(
        Order $order,
        string $methodCode,
        ?float $amount = null,
        ?int $processedByUserId = null,
        float $tip = 0
    ): array {
        $invoice = $this->invoiceService->createOrUpdateForOrder($order);

        // 1. Check if method exists
        $method = PaymentMethod::where('code', $methodCode)->firstOrFail();

        $paymentAmount = $amount ?? (float) $invoice->amount_due;
        $totalWithTip = $paymentAmount + $tip;

        // Idempotency Check
        // If an idempotency key is provided (or we generate one based on params?), check existing.
        // The callers (PaymentController) should ideally pass 'idempotency_key' if they want this feature.
        // Assuming we might receive it in a wrapper or add parameter.
        // For now, let's look for existing pending/completed payments for this invoice with same method & amount?
        // Or strictly use the 'metadata' or 'idempotency_key' column if we added it?
        // Migration 2025_09_18_080064 mentions 'idempotency_key' column.

        // NOTE: The signature of initiatePayment doesn't accept idempotency_key yet.
        // We'll assume the caller might pass it in array or we add implicit check.
        // Implicit check: If a PENDING payment exists for this Order + Method + Amount created < 1 min ago, return it.

        $existing = Payment::where('invoice_id', $invoice->id)
            ->where('payment_method_id', $method->id)
            ->where('amount', $totalWithTip)
            ->where('created_at', '>=', now()->subMinutes(1)) // 1 min debounce
            ->whereIn('payment_status_id', [$this->getPaymentStatusId(Payment::STATUS_PENDING), $this->getPaymentStatusId(Payment::STATUS_COMPLETED)])
            ->first();

        if ($existing) {
            return [
                'success' => true,
                'payment_id' => $existing->id,
                'uuid' => $existing->uuid,
                'status' => $existing->status,
                'qr_string' => 'mock_qr_string_reused',
                'qr_reference' => $existing->qr_reference,
                'message' => 'Returning existing payment (idempotency)',
            ];
        }

        // 3. Logic depends on method
        if (in_array($methodCode, ['qr', 'aba_pay', 'wing'])) {
            $txnId = 'INIT-' . Str::random(12);
            // Create pending payment for QR
            $payment = (new Payment())->forceFill([
                'invoice_id' => $invoice->id,
                'payment_method_id' => $method->id,
                'amount' => $totalWithTip,
                'currency' => $order->currency,
                'payment_status_id' => $this->getPaymentStatusId(Payment::STATUS_PENDING),
                'uuid' => Str::uuid(),
                'transaction_id' => $txnId,
                'reference_number' => $txnId,
                'expires_at' => now()->addMinutes(15),
                'tip' => $tip,
                'confirmed_by' => $processedByUserId,
            ]);

            // Generate QR reference (e.g. for KHQR)
            $qrRef = 'KHQR-' . $payment->transaction_id;
            $payment->qr_reference = $qrRef;
            $invoice->payments()->save($payment);

            return [
                'success' => true,
                'payment_id' => $payment->id,
                'uuid' => $payment->uuid,
                'status' => 'pending',
                'qr_string' => 'mock_qr_string_for_' . $qrRef, // In prod, use QrCodeGenerator
                'qr_reference' => $qrRef,
            ];

        } elseif ($methodCode === 'cash') {
            $txnId = 'CASH-' . Str::random(12);
            // For POS cash payments, create a completed payment directly
            $payment = (new Payment())->forceFill([
                'invoice_id' => $invoice->id,
                'payment_method_id' => $method->id,
                'amount' => $totalWithTip,
                'currency' => $order->currency,
                'payment_status_id' => $this->getPaymentStatusId(Payment::STATUS_COMPLETED),
                'uuid' => Str::uuid(),
                'transaction_id' => $txnId,
                'reference_number' => $txnId,
                'processed_at' => now(),
                'confirmed_by' => $processedByUserId,
                'confirmed_at' => now(),
                'tip' => $tip,
            ]);

            $invoice->payments()->save($payment);

            // Reconcile invoice status after payment
            $this->invoiceService->reconcileStatus($invoice);

            // Update order payment status
            $order->refresh();
            if ($invoice->amount_due <= 0) {
                $order->update([
                    'payment_status' => Order::PAYMENT_STATUS_PAID,
                    'payment_collected_by' => $processedByUserId,
                    'payment_collected_at' => now(),
                ]);

                // Award loyalty points
                if ($order->customer_id) {
                    $this->loyaltyService->awardPoints($order);
                }

                // Send notification
                try {
                    $this->notificationService->sendOrderNotification($order, 'paid');
                } catch (\Exception $e) {
                    // ignore
                }
            } else {
                $order->update(['payment_status' => Order::PAYMENT_STATUS_PARTIAL]);
            }

            return [
                'success' => true,
                'payment_id' => $payment->id,
                'uuid' => $payment->uuid,
                'status' => 'completed',
                'amount_paid' => $totalWithTip,
                'message' => 'Cash payment recorded successfully.',
            ];

        } elseif ($methodCode === 'card') {
            $txnId = 'CARD-' . Str::random(12);
            // Card payments - create pending payment (will be completed via webhook)
            $payment = (new Payment())->forceFill([
                'invoice_id' => $invoice->id,
                'payment_method_id' => $method->id,
                'amount' => $totalWithTip,
                'currency' => $order->currency,
                'payment_status_id' => $this->getPaymentStatusId(Payment::STATUS_PENDING),
                'uuid' => Str::uuid(),
                'transaction_id' => $txnId,
                'reference_number' => $txnId,
                'expires_at' => now()->addMinutes(15),
                'tip' => $tip,
                'confirmed_by' => $processedByUserId,
            ]);

            $invoice->payments()->save($payment);

            return [
                'success' => true,
                'payment_id' => $payment->id,
                'uuid' => $payment->uuid,
                'status' => 'pending',
                'message' => 'Card payment initiated. Waiting for terminal confirmation.',
            ];
        }

        throw new \Exception("Payment method $methodCode not fully implemented in initiation.");
    }

    /**
     * Cancel a payment.
     */
    public function cancelPayment(Payment $payment, string $reason): bool
    {
        if (!$payment->isPending()) {
            return false;
        }

        $payment->update([
            'payment_status_id' => $this->getPaymentStatusId(Payment::STATUS_CANCELLED),
            'failure_reason' => $reason,
        ]);

        return true;
    }

    /**
     * Retry a failed payment.
     */
    public function retryPayment(Payment $payment): array
    {
        if (!$payment->canRetry()) {
            throw new \Exception('Payment cannot be retried.');
        }

        // Reset status
        $payment->update([
            'payment_status_id' => $this->getPaymentStatusId(Payment::STATUS_PENDING),
            'failure_reason' => null,
            'expires_at' => now()->addMinutes(15),
        ]);

        return [
            'success' => true,
            'payment_id' => $payment->id,
            'status' => 'pending',
        ];
    }

    /**
     * Process webhook/callback from gateway.
     */
    public function processWebhook(array $payload): Payment
    {
        // Example logic
        $ref = $payload['qr_reference'] ?? $payload['reference_number'] ?? null;
        if (!$ref)
            throw new \Exception('No reference found in payload.');

        $payment = Payment::where('qr_reference', $ref)
            ->orWhere('reference_number', $ref)
            ->firstOrFail();

        // FIX Issue #9: Idempotency - Prevent double-processing completed payments
        if ($payment->isCompleted()) {
            \Log::info("⚠️ Payment {$payment->id} already completed, skipping duplicate webhook.");
            return $payment;
        }

        $status = $payload['status'] ?? 'pending';

        if ($status === 'success') {
            $payment->update([
                'payment_status_id' => $this->getPaymentStatusId(Payment::STATUS_COMPLETED),
                'processed_at' => now(),
                'gateway_reference' => $payload['gateway_reference'] ?? null,
            ]);

            $this->invoiceService->reconcileStatus($payment->invoice);

            // Trigger order paid logic
            $order = $payment->invoice->order;
            if ($order && $payment->invoice->amount_due <= 0) {
                $this->loyaltyService->awardPoints($order);
                $this->notificationService->sendOrderNotification($order, 'paid');

                // Free table if this is a dine-in order
                try {
                    app(TableStatusService::class)->completeAndReleaseAfterPayment($order, null);
                } catch (\Throwable $e) {
                    \Log::warning('Table release after webhook payment failed', [
                        'order_id' => $order->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

        } elseif ($status === 'failed') {
            $payment->update([
                'payment_status_id' => $this->getPaymentStatusId(Payment::STATUS_FAILED),
                'failure_reason' => $payload['failure_reason'] ?? 'Gateway reported failure',
            ]);
        }

        return $payment;
    }

    /**
     * Get payment status (helper)
     */
    public function getPaymentStatus(Payment $payment): array
    {
        return [
            'id' => $payment->id,
            'status' => $payment->status,
            'amount' => $payment->amount,
            'is_paid' => $payment->isCompleted(),
        ];
    }

    /**
     * Process order payment (Generic / Manual).
     * Replaces duplicated logic in OrderPaymentController.
     */
    public function processOrderPayment(Order $order, array $paymentData, $processedByUserId = null): Payment
    {
        return DB::transaction(function () use ($order, $paymentData, $processedByUserId) {
            // 1. Ensure Invoice Exists
            $invoice = $this->invoiceService->createOrUpdateForOrder($order);

            // 2. Validate Method
            $methodId = $paymentData['payment_method_id'] ?? null;
            if (!$methodId && !empty($paymentData['payment_method_code'])) {
                $method = PaymentMethod::where('code', $paymentData['payment_method_code'])->first();
                $methodId = $method?->id;
            }

            // 3. Create Payment Record
            // 3. Create Payment Record
            $payment = (new Payment())->forceFill([
                'invoice_id' => $invoice->id,
                'payment_method_id' => $methodId,
                'amount' => $paymentData['amount'],
                'currency' => $order->currency,
                'transaction_id' => $txnId = ($paymentData['transaction_id'] ?? 'TXN-' . Str::upper(Str::random(12))),
                'reference_number' => $paymentData['reference_number'] ?? $txnId,
                'payment_status_id' => $this->getPaymentStatusId(Payment::STATUS_COMPLETED),
                'processed_at' => now(),
                'confirmed_by' => $processedByUserId,
                'confirmed_at' => now(),
                'notes' => $paymentData['notes'] ?? null,
                'cash_received' => $paymentData['cash_received'] ?? null,
                'change_given' => $paymentData['change_given'] ?? 0,
            ]);

            // Handle specific UUID if passed
            if (isset($paymentData['uuid'])) {
                $payment->uuid = $paymentData['uuid'];
            }

            $invoice->payments()->save($payment);

            // Log Audit
            if (class_exists(\App\Models\PaymentAuditLog::class)) {
                \App\Models\PaymentAuditLog::log(
                    $payment,
                    'payment_received',
                    null,
                    'completed',
                    $processedByUserId,
                    ['note' => 'Payment processed via service', 'mode' => $paymentData['mode'] ?? 'unknown']
                );
            }

            // 4. Reconcile Invoice Status
            $this->invoiceService->reconcileStatus($invoice);

            // 5. Update Order Payment Status
            $order->refresh(); // Invoice reconciliation might trigger observers? 
            // Explicitly set order payment status if fully paid based on invoice
            if ($invoice->amount_due <= 0) {
                $order->update([
                    'payment_status' => Order::PAYMENT_STATUS_PAID,
                    'payment_collected_by' => $processedByUserId,
                    'payment_collected_at' => now(),
                ]);

                // Loyalty
                if ($order->customer_id) {
                    $this->loyaltyService->awardPoints($order);
                }

                // Notifications
                try {
                    $this->notificationService->sendOrderNotification($order, 'paid');
                } catch (\Exception $e) {
                    // ignore
                }

                // FIX D0.1: Auto-deduct inventory if order is completed
                if ($order->status === 'completed') {
                    try {
                        $deductionResult = $this->inventoryDeductionService->processOrderDeductions(
                            $order,
                            $processedByUserId ?? 1
                        );

                        \Log::info('Inventory auto-deduction completed', [
                            'order_id' => $order->id,
                            'deductions_count' => $deductionResult['deductions_count'],
                            'success' => $deductionResult['success']
                        ]);
                    } catch (\Exception $e) {
                        \Log::error('Inventory deduction failed', [
                            'order_id' => $order->id,
                            'error' => $e->getMessage()
                        ]);
                        // Don't fail the payment, just log the error
                    }
                }
            } else {
                $order->update(['payment_status' => Order::PAYMENT_STATUS_PARTIAL]);
            }

            return $payment;
        });
    }

    /**
     * Mark an order as fully paid manually (Admin override).
     */
    public function markAsPaid(Order $order, $processedByUserId, string $note = 'Manual mark as paid'): void
    {
        DB::transaction(function () use ($order, $processedByUserId, $note) {
            $order->loadMissing('invoice');
            $invoice = $this->invoiceService->createOrUpdateForOrder($order);

            $existingPaid = $invoice->payments()
                ->whereHas('paymentStatus', function ($q) {
                    $q->where('code', 'completed');
                })
                ->sum('amount');

            if ($existingPaid < $order->total_amount) {
                $diff = $order->total_amount - $existingPaid;

                // Resolve Cash method
                $paymentMethod = PaymentMethod::where('code', 'cash')->where('is_active', true)->first()
                    ?? PaymentMethod::where('is_active', true)->first();

                $this->processOrderPayment($order, [
                    'payment_method_id' => $paymentMethod->id,
                    'amount' => $diff,
                    'transaction_id' => 'MANUAL-ADMIN-' . Str::upper(Str::random(8)),
                    'notes' => $note,
                    'mode' => 'admin_manual'
                ], $processedByUserId);
            }
        });
    }

    /**
     * Mark order as unpaid (void payments).
     */
    public function markAsUnpaid(Order $order, $processedByUserId, string $note = 'Manual mark as unpaid'): void
    {
        DB::transaction(function () use ($order, $processedByUserId, $note) {
            $order->update([
                'payment_status' => 'unpaid',
                'payment_collected_by' => null,
                'payment_collected_at' => null,
            ]);

            $invoice = $order->invoice;
            if ($invoice) {
                foreach ($invoice->payments as $payment) {
                    if ($payment->status === 'completed') {
                        $payment->update(['payment_status_id' => $this->getPaymentStatusId(Payment::STATUS_CANCELLED)]);

                        if (class_exists(PaymentAuditLog::class)) {
                            PaymentAuditLog::log($payment, 'admin_manual_unpay', 'completed', 'cancelled', $processedByUserId, ['note' => $note]);
                        }
                    }
                }
                $this->invoiceService->reconcileStatus($invoice);
            }
        });
    }
    /**
     * Helper to get payment status ID by code
     */
    protected function getPaymentStatusId(string $code): int
    {
        return PaymentStatus::where('code', $code)->value('id')
            ?? PaymentStatus::where('code', 'pending')->value('id')
            ?? 1; // Fallback
    }
}

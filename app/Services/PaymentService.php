<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Invoice;
use App\Services\InvoiceService;
use App\Services\NotificationService;
use App\Services\LoyaltyService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use App\Models\PaymentAuditLog; // Ensure this model exists or use logic

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
     */
    public function initiatePayment(Order $order, string $methodCode): array
    {
        $invoice = $this->invoiceService->createOrUpdateForOrder($order);

        // 1. Check if method exists
        $method = PaymentMethod::where('code', $methodCode)->firstOrFail();

        // 2. Logic depends on method
        if (in_array($methodCode, ['qr', 'aba_pay', 'wing'])) {
            // Create pending payment for QR
            $payment = new Payment([
                'invoice_id' => $invoice->id,
                'payment_method_id' => $method->id,
                'amount' => $invoice->amount_due,
                'currency' => $order->currency,
                'status' => Payment::STATUS_PENDING,
                'uuid' => Str::uuid(),
                'transaction_id' => 'INIT-' . Str::random(12),
                'expires_at' => now()->addMinutes(15), 
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
            // Cash flow is usually "Collect Payment" not "Initiate"
            // But if user selects Cash on Checkout, we just create a pending payment?
            // Or just return success.
             return [
                'success' => true,
                'message' => 'Please proceed to counter or wait for delivery.',
                'status' => 'pending_manual',
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
            'status' => Payment::STATUS_CANCELLED,
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
            'status' => Payment::STATUS_PENDING,
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
        if (!$ref) throw new \Exception('No reference found in payload.');
        
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
                'status' => Payment::STATUS_COMPLETED,
                'processed_at' => now(),
                'gateway_reference' => $payload['gateway_reference'] ?? null,
            ]);
            
            $this->invoiceService->reconcileStatus($payment->invoice);
            
            // Trigger order paid logic
            $order = $payment->invoice->order;
            if ($order && $payment->invoice->amount_due <= 0) {
                 $this->loyaltyService->awardPoints($order);
                 $this->notificationService->sendOrderNotification($order, 'paid');
            }
            
        } elseif ($status === 'failed') {
            $payment->update([
                'status' => Payment::STATUS_FAILED,
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
            $payment = new Payment([
                'invoice_id' => $invoice->id,
                'payment_method_id' => $methodId,
                'amount' => $paymentData['amount'],
                'currency' => $order->currency,
                'transaction_id' => $paymentData['transaction_id'] ?? 'TXN-' . Str::upper(Str::random(12)),
                'reference_number' => $paymentData['reference_number'] ?? null,
                'status' => Payment::STATUS_COMPLETED,
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
            if (class_exists(PaymentAuditLog::class)) {
                PaymentAuditLog::log(
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
            
            $existingPaid = $invoice->payments()->where('status', 'completed')->sum('amount');
            
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
                         $payment->update(['status' => 'cancelled']);
                         
                         if (class_exists(PaymentAuditLog::class)) {
                             PaymentAuditLog::log($payment, 'admin_manual_unpay', 'completed', 'cancelled', $processedByUserId, ['note' => $note]);
                         }
                     }
                 }
                 $this->invoiceService->reconcileStatus($invoice);
             }
        });
    }
}

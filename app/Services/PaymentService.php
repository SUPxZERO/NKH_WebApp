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

    public function __construct(
        InvoiceService $invoiceService,
        NotificationService $notificationService,
        LoyaltyService $loyaltyService
    ) {
        $this->invoiceService = $invoiceService;
        $this->notificationService = $notificationService;
        $this->loyaltyService = $loyaltyService;
    }

    /**
     * Process a payment for an order.
     * Creates invoice if needed, records payment, reconciles, and updates order.
     */
    public function processOrderPayment(Order $order, array $paymentData, $processedByUserId = null): Payment
    {
        return DB::transaction(function () use ($order, $paymentData, $processedByUserId) {
            // 1. Ensure Invoice Exists
            $invoice = $this->invoiceService->createOrUpdateForOrder($order);

            // 2. Validate Payment Amount (Optional: Check if overpaying?)
            // For now, allow overpayment or partial payment.
            
            // 3. Create Payment Record
            // Resolve Payment Method ID if code passed? 
            // Assume paymentData has payment_method_id, amount
            
            $payment = new Payment([
                'invoice_id' => $invoice->id,
                'payment_method_id' => $paymentData['payment_method_id'],
                'amount' => $paymentData['amount'],
                'transaction_id' => $paymentData['transaction_id'] ?? 'TXN-' . Str::upper(Str::random(12)),
                'reference_number' => $paymentData['reference_number'] ?? null,
                'status' => 'completed', // Assume completed for now (or pending for async gateways)
                'processed_at' => now(),
                'notes' => $paymentData['notes'] ?? null,
            ]);
            $invoice->payments()->save($payment);

            // Log Audit
            if (class_exists(PaymentAuditLog::class)) {
                PaymentAuditLog::log(
                    $payment,
                    'payment_received',
                    null,
                    'completed',
                    $processedByUserId,
                    ['note' => 'Payment processed via service']
                );
            }

            // 4. Reconcile Invoice Status
            $this->invoiceService->reconcileStatus($invoice);
            $invoice->refresh();

            // 5. Update Order Status if fully paid
            if ($invoice->amount_due <= 0) {
                 // Check if order should be completed? 
                 // Usually for Dine-in, paying closes the order?
                 // Or just marks it as paid. 
                 // OrderController logic had "Close order & free table only when fully paid"
                 
                 // Let's just handle payment status here. Order completion might be strict separation.
                 // But for convenience, let's replicate logic or make it configurable?
                 // The Controller logic specifically completed the order.
                 
                $updates = ['payment_status' => 'paid'];
                
                // If it was unpaid, now paid.
                if ($order->status === 'completed' && $order->payment_status !== 'paid') {
                    // Already completed service, just paying late?
                } else {
                     // For now, let's NOT auto-complete the order status here unless requested.
                     // The PaymentService should focus on Money. Order State (Preparing/Served) is different.
                     // BUT, for "Pay & Close" flow, it's useful.
                     // Let's leave order status update to the Caller or a separate listener.
                     // EXCEPT existing controller logic did:
                     // if ($invoice->amount_due <= 0) { 
                     //    $order->update(['status' => 'completed', ...]); 
                     //    if table... table->available
                     // }
                     // We should probably invoke a "CloseOrder" action if paid?
                }
                
                // Loyalty Points
                if ($order->customer_id) {
                    $this->loyaltyService->awardPoints($order);
                }

                // Notify
                try {
                    $this->notificationService->sendOrderNotification($order, 'paid');
                } catch (\Exception $e) {
                    \Log::warning('Failed to send order paid notification: ' . $e->getMessage());
                }
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
                    
                 if (!$paymentMethod) {
                     // Should not happen in production usually
                     throw new \RuntimeException('No active payment method available.');
                 }

                $payment = new Payment([
                    'invoice_id' => $invoice->id,
                    'payment_method_id' => $paymentMethod->id,
                    'amount' => $diff,
                    'transaction_id' => 'MANUAL-ADMIN-' . Str::upper(Str::random(8)),
                    'status' => 'completed',
                    'processed_at' => now(),
                    'notes' => $note,
                ]);
                $invoice->payments()->save($payment);
                
                if (class_exists(PaymentAuditLog::class)) {
                     PaymentAuditLog::log($payment, 'admin_manual_pay', null, 'completed', $processedByUserId, ['note' => $note]);
                }
            }
            
            $this->invoiceService->reconcileStatus($invoice);
            
            // Loyalty and Notifications
            if ($order->customer_id) {
                $this->loyaltyService->awardPoints($order);
            }
            try {
                $this->notificationService->sendOrderNotification($order, 'paid');
            } catch (\Exception $e) {
                // ignore
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

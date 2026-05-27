<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use Mockery;
use App\Services\PaymentService;
use App\Services\InvoiceService;
use App\Services\NotificationService;
use App\Services\LoyaltyService;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\Invoice;
use App\Models\User;
use App\Models\Location;
use App\Models\Category;
use App\Models\MenuItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class PaymentServiceTest extends TestCase
{
    use RefreshDatabase;

    protected PaymentService $service;
    protected $invoiceService;
    protected $notificationService;
    protected $loyaltyService;
    protected $inventoryDeductionService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->invoiceService = Mockery::mock(InvoiceService::class);
        $this->notificationService = Mockery::mock(NotificationService::class);
        $this->loyaltyService = Mockery::mock(LoyaltyService::class);
        $this->inventoryDeductionService = Mockery::mock(\App\Services\InventoryDeductionService::class);

        $this->service = new PaymentService(
            $this->invoiceService,
            $this->notificationService,
            $this->loyaltyService,
            $this->inventoryDeductionService
        );

        // Ensure PaymentMethod exists
        if (PaymentMethod::count() === 0) {
            PaymentMethod::create([
                'name' => 'Cash',
                'code' => 'cash',
                'type' => 'offline', // Add required field
                'is_active' => true,
            ]);
        }
        
        // Ensure PaymentStatuses exist for foreign key constraints
        if (\App\Models\PaymentStatus::count() === 0) {
            \App\Models\PaymentStatus::insert([
                ['name' => 'Pending', 'code' => 'pending', 'is_active' => true],
                ['name' => 'Completed', 'code' => 'completed', 'is_active' => true],
            ]);
        }
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_process_order_payment_successful()
    {
        // 1. Setup Data
        $location = Location::factory()->create();
        
        $category = Category::factory()->create([
             'is_active' => 1,
             'display_order' => 1
        ]);

        $customer = \App\Models\Customer::factory()->create();

        $order = Order::factory()->create([
            'order_number' => 'ORD-' . Str::random(5),
            'location_id' => $location->id,
            'subtotal' => 90.00,
            'tax_amount' => 10.00,
            'total_amount' => 100.00,
            'delivery_fee' => 0.00,
            'service_charge' => 0.00,
            'discount_amount' => 0.00,
            'customer_id' => $customer->id,
            'currency' => 'USD',
            // Note: approval_status was removed from the migrations and handled by order_status_id,
            // but the test previously used it. If it fails, we will remove it.
        ]);
        
        // Force set status if needed, but defaults should imply pending/unpaid
        
        $paymentMethod = PaymentMethod::first();

        // Create a real Invoice to be returned by mock
        $invoice = Invoice::factory()->create([
            'order_id' => $order->id,
            'location_id' => $location->id,
            'invoice_number' => 'INV-' . $order->order_number,
            'total_amount' => 100.00,
            'amount_paid' => 0.00,
            'amount_due' => 100.00,
            'status' => 'issued',
        ]);

        // 2. Setup Mocks
        $this->invoiceService->shouldReceive('createOrUpdateForOrder')
            ->once()
            ->with($order)
            ->andReturn($invoice);

        $this->invoiceService->shouldReceive('reconcileStatus')
            ->once()
            ->with(Mockery::on(function ($arg) use ($invoice) {
                return $arg->id === $invoice->id;
            }))
            ->andReturnUsing(function ($inv) {
                 // Simulate what reconcileStatus does (update amount_due)
                 // But processOrderPayment checks $invoice->amount_due <= 0 to trigger notifications.
                 // So I MUST update the invoice instance here.
                 $totalPaid = $inv->payments()->sum('amount');
                 $inv->amount_paid = $totalPaid;
                 $inv->amount_due = max(0, $inv->total_amount - $totalPaid);
                 $inv->save();
            });

        // Expect notifications and loyalty points if paid full
        $this->loyaltyService->shouldReceive('awardPoints')->once()->with(Mockery::on(function ($arg) use ($order) {
            return $arg->id === $order->id;
        })); 
        $this->notificationService->shouldReceive('sendOrderNotification')->once()->with(Mockery::on(function ($arg) use ($order) {
            return $arg->id === $order->id;
        }), 'paid');
        $this->inventoryDeductionService->shouldReceive('processOrderDeductions')->never();

        // 3. Execute
        $paymentData = [
            'payment_method_id' => $paymentMethod->id,
            'amount' => 100.00,
            'reference_number' => 'REF-' . Str::random(8), // Add required field
            'notes' => 'Test Payment',
        ];

        $payment = $this->service->processOrderPayment($order, $paymentData);

        // 4. Assertions
        $this->assertNotNull($payment);
        $this->assertEquals(100.00, $payment->amount);
        $this->assertEquals('completed', $payment->status);
        
        $invoice->refresh();
        $this->assertEquals(0.00, $invoice->amount_due);
    }
}

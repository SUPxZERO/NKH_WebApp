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
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;

class PaymentServiceTest extends TestCase
{
    use DatabaseTransactions;

    protected PaymentService $service;
    protected $invoiceService;
    protected $notificationService;
    protected $loyaltyService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->invoiceService = Mockery::mock(InvoiceService::class);
        $this->notificationService = Mockery::mock(NotificationService::class);
        $this->loyaltyService = Mockery::mock(LoyaltyService::class);

        $this->service = new PaymentService(
            $this->invoiceService,
            $this->notificationService,
            $this->loyaltyService
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
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_process_order_payment_successful()
    {
        // 1. Setup Data
        $category = Category::create([
             'name' => 'Test Cat ' . Str::random(5), 
             'slug' => 'test-cat-' . Str::random(5), 
             'is_active' => 1,
             'display_order' => 1
        ]);
        $location = Location::create([
            'code' => 'LOC-' . Str::upper(Str::random(3)), // Required
            'name' => 'Loc ' . Str::random(5), 
            'address_line1' => '123 Test St', // Correct field
            'city' => 'Test City',
            'state' => 'TS',
            'postal_code' => '12345',
            'country' => 'TestLand',
            'phone' => '1234567890', 
            'is_active' => 1
        ]);

        $order = Order::create([
            'order_number' => 'ORD-' . Str::random(5),
            'location_id' => $location->id,
            'subtotal' => 90.00,
            'tax_amount' => 10.00,
            'total_amount' => 100.00,
            'delivery_fee' => 0.00,
            'service_charge' => 0.00,
            'discount_amount' => 0.00,
            // 'payment_status' => 'unpaid', // Guarded, stripped anyway
            // 'status' => 'pending', // Guarded
            'order_type' => 'pickup', 
            'customer_name' => 'Test Customer', 
            'customer_phone' => '1234567890', 
            'approval_status' => 'pending', // Explicitly set
        ]);
        
        // Force set status if needed, but defaults should imply pending/unpaid
        
        $paymentMethod = PaymentMethod::first();

        // Create a real Invoice to be returned by mock
        $invoice = Invoice::create([
            'order_id' => $order->id,
            'location_id' => $location->id, // Add required field
            'invoice_number' => 'INV-' . $order->order_number,
            'total_amount' => 100.00,
            'amount_paid' => 0.00,
            'amount_due' => 100.00,
            'status' => 'issued',
            'issue_date' => now(), 
            'due_date' => now()->addDays(7), 
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

        // Expect notifications if paid full
        $this->loyaltyService->shouldReceive('awardPoints')->times(0); // No customer_id on order yet
        $this->notificationService->shouldReceive('sendOrderNotification')->once()->with($order, 'paid');

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

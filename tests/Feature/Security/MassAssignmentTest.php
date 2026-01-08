<?php

namespace Tests\Feature\Security;

use App\Models\User;
use App\Models\Order;
use App\Models\Location;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MassAssignmentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->location = Location::factory()->create();
        $this->customer = Customer::factory()->create();
    }

    /** @test */
    public function order_model_prevents_payment_status_mass_assignment()
    {
        // Attempt to bypass payment by mass-assigning payment_status
        $maliciousData = [
            'location_id' => $this->location->id,
            'customer_id' => $this->customer->id,
            'order_number' => 'TEST-001',
            'order_type' => 'delivery',
            'payment_status' => 'paid', // 🚨 ATTACK: Try to mark as paid without paying
            'status' => 'completed', // 🚨 ATTACK: Try to mark as completed
            'subtotal' => 100.00,
            'total_amount' => 100.00,
        ];

        $order = Order::create($maliciousData);

        // Should NOT have set payment_status or status from user input
        $this->assertNotEquals('paid', $order->payment_status);
        $this->assertNotEquals('completed', $order->status);
        
        // Verify other safe fields were set correctly
        $this->assertEquals($this->location->id, $order->location_id);
        $this->assertEquals(100.00, $order->subtotal);
    }

    /** @test */
    public function order_model_prevents_approved_by_manipulation()
    {
        $maliciousData = [
            'location_id' => $this->location->id,
            'customer_id' => $this->customer->id,
            'order_number' => 'TEST-002',
            'order_type' => 'delivery',
            'approved_by' => $this->admin->id, // 🚨 ATTACK: Try to fake approval
            'is_auto_approved' => true, // 🚨 ATTACK: Try to bypass approval
            'subtotal' => 50.00,
            'total_amount' => 50.00,
        ];

        $order = Order::create($maliciousData);

        // Should NOT have set these protected fields
        $this->assertNull($order->approved_by);
        $this->assertNotTrue($order->is_auto_approved);
    }

    /**  @test */
    public function order_model_allows_safe_fields()
    {
        // These fields SHOULD be mass-assignable
        $safeData = [
            'location_id' => $this->location->id,
            'customer_id' => $this->customer->id,
            'order_number' => 'TEST-003',
            'order_type' => 'dine_in',
            'subtotal' => 75.00,
            'tax_amount' => 7.50,
            'total_amount' => 82.50,
            'special_instructions' => 'No onions',
        ];

        $order = Order::create($safeData);

        // All safe fields should be set correctly
        $this->assertEquals('dine_in', $order->order_type);
        $this->assertEquals(75.00, $order->subtotal);
        $this->assertEquals('No onions', $order->special_instructions);
    }

    /** @test */
    public function payment_service_can_still_update_payment_status()
    {
        $order = Order::factory()->create([
            'payment_status' => 'unpaid'
        ]);

        // PaymentService workflow (not mass assignment)
        $order->payment_status = 'paid';
        $order->save();

        $this->assertEquals('paid', $order->fresh()->payment_status);
    }
}

<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Order;
use App\Models\User;
use App\Models\Location;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;

class OrderModelTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function requires_approval_returns_true_for_delivery_orders()
    {
        $order = Order::factory()->make([
            'order_type' => 'delivery',
            'is_auto_approved' => false,
        ]);

        $this->assertTrue($order->requiresApproval());
    }

    /** @test */
    public function requires_approval_returns_true_for_pickup_orders()
    {
        $order = Order::factory()->make([
            'order_type' => 'pickup',
            'is_auto_approved' => false,
        ]);

        $this->assertTrue($order->requiresApproval());
    }

    /** @test */
    public function requires_approval_returns_false_for_dine_in_orders()
    {
        $order = Order::factory()->make([
            'order_type' => 'dine-in',
        ]);

        $this->assertFalse($order->requiresApproval());
    }

    /** @test */
    public function requires_approval_returns_false_for_auto_approved_orders()
    {
        $order = Order::factory()->make([
            'order_type' => 'delivery',
            'is_auto_approved' => true,
        ]);

        $this->assertFalse($order->requiresApproval());
    }

    /** @test */
    public function approve_method_updates_order_correctly()
    {
        $location = Location::factory()->create();
        $customer = Customer::factory()->create();
        
        $order = Order::factory()->create([
            'approval_status' => Order::APPROVAL_STATUS_PENDING,
            'status' => 'pending',
            'location_id' => $location->id,
            'customer_id' => $customer->id,
        ]);

        $admin = User::factory()->create();

        $result = $order->approve($admin->id);

        $this->assertTrue($result);
        $this->assertEquals(Order::APPROVAL_STATUS_APPROVED, $order->fresh()->approval_status);
        $this->assertEquals('received', $order->fresh()->status);
        $this->assertEquals($admin->id, $order->fresh()->approved_by);
        $this->assertNotNull($order->fresh()->approved_at);
        $this->assertNull($order->fresh()->rejection_reason);
    }

    /** @test */
    public function reject_method_updates_order_correctly()
    {
        $location = Location::factory()->create();
        $customer = Customer::factory()->create();
        
        $order = Order::factory()->create([
            'approval_status' => Order::APPROVAL_STATUS_PENDING,
            'status' => 'pending',
            'location_id' => $location->id,
            'customer_id' => $customer->id,
        ]);

        $reason = 'Kitchen is closed for maintenance';
        $result = $order->reject($reason);

        $this->assertTrue($result);
        $this->assertEquals(Order::APPROVAL_STATUS_REJECTED, $order->fresh()->approval_status);
        $this->assertEquals('cancelled', $order->fresh()->status);
        $this->assertEquals($reason, $order->fresh()->rejection_reason);
    }

    /** @test */
    public function is_pending_approval_returns_true_for_pending_orders()
    {
        $order = Order::factory()->make([
            'approval_status' => Order::APPROVAL_STATUS_PENDING,
        ]);

        $this->assertTrue($order->isPendingApproval());
    }

    /** @test */
    public function is_approved_returns_true_for_approved_orders()
    {
        $order = Order::factory()->make([
            'approval_status' => Order::APPROVAL_STATUS_APPROVED,
        ]);

        $this->assertTrue($order->isApproved());
    }

    /** @test */
    public function is_rejected_returns_true_for_rejected_orders()
    {
        $order = Order::factory()->make([
            'approval_status' => Order::APPROVAL_STATUS_REJECTED,
        ]);

        $this->assertTrue($order->isRejected());
    }

    /** @test */
    public function approved_by_relationship_works()
    {
        $admin = User::factory()->create();
        $location = Location::factory()->create();
        $customer = Customer::factory()->create();
        
        $order = Order::factory()->create([
            'approved_by' => $admin->id,
            'location_id' => $location->id,
            'customer_id' => $customer->id,
        ]);

        $this->assertInstanceOf(User::class, $order->approvedBy);
        $this->assertEquals($admin->id, $order->approvedBy->id);
    }
}

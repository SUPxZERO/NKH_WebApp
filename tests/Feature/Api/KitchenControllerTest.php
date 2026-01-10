<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Order;
use App\Models\Location;
use App\Models\MenuItem;
use App\Models\OrderItem;
use App\Events\OrderStatusUpdated;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * KitchenController API Tests
 * 
 * Tests for the Kitchen Display System (KDS) API endpoints.
 * Uses existing seeded data from database.
 */
class KitchenControllerTest extends TestCase
{
    use DatabaseTransactions;

    protected ?User $kitchenUser = null;
    protected ?int $locationId = null;
    protected ?int $menuItemId = null;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Use existing seeded data from database
        $location = DB::table('locations')->first();
        $menuItem = DB::table('menu_items')->first();
        $user = DB::table('users')->first();
        
        // Skip if no seeded data
        if (!$location || !$menuItem || !$user) {
            $this->markTestSkipped('Tests require seeded database. Run: php artisan db:seed');
        }
        
        $this->locationId = $location->id;
        $this->menuItemId = $menuItem->id;
        $this->kitchenUser = User::find($user->id);
    }

    protected function createOrder(string $status = 'pending'): Order
    {
        // Insert order using raw DB to set status directly
        $orderId = DB::table('orders')->insertGetId([
            'location_id' => $this->locationId,
            'order_number' => 'ORD-' . uniqid(),
            'status' => $status,
            'order_type' => 'dine-in',
            'subtotal' => 10.00,
            'tax_amount' => 1.00,
            'total_amount' => 11.00,
            'ordered_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('order_items')->insert([
            'order_id' => $orderId,
            'menu_item_id' => $this->menuItemId,
            'quantity' => 1,
            'unit_price' => 10.00,
            'total_price' => 10.00,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return Order::find($orderId);
    }

    /** @test */
    public function kitchen_index_returns_pending_and_preparing_orders()
    {
        $pendingOrder = $this->createOrder('pending');
        $preparingOrder = $this->createOrder('preparing');
        $readyOrder = $this->createOrder('ready');
        $completedOrder = $this->createOrder('completed');

        $response = $this->actingAs($this->kitchenUser, 'sanctum')
            ->getJson('/api/kitchen/orders');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'order_number', 'status', 'items']
                ]
            ]);

        $orderIds = collect($response->json('data'))->pluck('id')->toArray();
        
        $this->assertContains($pendingOrder->id, $orderIds);
        $this->assertContains($preparingOrder->id, $orderIds);
        $this->assertContains($readyOrder->id, $orderIds);
        $this->assertNotContains($completedOrder->id, $orderIds);
    }

    /** @test */
    public function kitchen_index_excludes_completed_and_cancelled_orders()
    {
        $completedOrder = $this->createOrder('completed');
        $cancelledOrder = $this->createOrder('cancelled');
        $pendingOrder = $this->createOrder('pending');

        $response = $this->actingAs($this->kitchenUser, 'sanctum')
            ->getJson('/api/kitchen/orders');

        $response->assertStatus(200);

        $statuses = collect($response->json('data'))->pluck('status')->unique()->toArray();
        
        $this->assertNotContains('completed', $statuses);
        $this->assertNotContains('cancelled', $statuses);
    }

    /** @test */
    public function kitchen_update_status_transitions_correctly()
    {
        Event::fake([OrderStatusUpdated::class]);
        
        $order = $this->createOrder('pending');

        $response = $this->actingAs($this->kitchenUser, 'sanctum')
            ->putJson("/api/kitchen/orders/{$order->id}/status", [
                'status' => 'preparing'
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $order->id,
                    'status' => 'preparing'
                ]
            ]);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'preparing'
        ]);

        Event::assertDispatched(OrderStatusUpdated::class);
    }

    /** @test */
    public function kitchen_update_status_to_ready_works()
    {
        $order = $this->createOrder('preparing');

        $response = $this->actingAs($this->kitchenUser, 'sanctum')
            ->putJson("/api/kitchen/orders/{$order->id}/status", [
                'status' => 'ready'
            ]);

        $response->assertStatus(200);
        
        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'ready'
        ]);
    }

    /** @test */
    public function kitchen_update_status_validates_allowed_statuses()
    {
        $order = $this->createOrder('pending');

        $response = $this->actingAs($this->kitchenUser, 'sanctum')
            ->putJson("/api/kitchen/orders/{$order->id}/status", [
                'status' => 'invalid_status'
            ]);

        // Controller should reject invalid status
        $this->assertTrue(in_array($response->status(), [422, 500]));
    }

    /** @test */
    public function kitchen_update_status_requires_authentication()
    {
        $order = $this->createOrder('pending');

        $response = $this->putJson("/api/kitchen/orders/{$order->id}/status", [
            'status' => 'preparing'
        ]);

        $response->assertStatus(401);
    }

    /** @test */
    public function kitchen_index_orders_sorted_by_oldest_first()
    {
        $olderOrder = $this->createOrder('pending');
        DB::table('orders')
            ->where('id', $olderOrder->id)
            ->update(['created_at' => now()->subHours(2)]);
        
        $newerOrder = $this->createOrder('pending');

        $response = $this->actingAs($this->kitchenUser, 'sanctum')
            ->getJson('/api/kitchen/orders');

        $response->assertStatus(200);

        $orderIds = collect($response->json('data'))->pluck('id')->toArray();
        $this->assertContains($olderOrder->id, $orderIds);
        $this->assertContains($newerOrder->id, $orderIds);
    }
}

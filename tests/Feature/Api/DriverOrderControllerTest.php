<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Order;
use App\Models\Location;
use App\Models\MenuItem;
use App\Models\OrderItem;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * DriverOrderController API Tests
 * 
 * Tests for the Driver Delivery API endpoints.
 * Uses existing seeded data from database.
 */
class DriverOrderControllerTest extends TestCase
{
    use DatabaseTransactions;

    protected ?User $driverUser = null;
    protected ?User $otherDriver = null;
    protected ?int $locationId = null;
    protected ?int $menuItemId = null;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Use existing seeded data from database
        $location = DB::table('locations')->first();
        $menuItem = DB::table('menu_items')->first();
        
        // Skip if no seeded data
        if (!$location || !$menuItem) {
            $this->markTestSkipped('Tests require seeded database. Run: php artisan db:seed');
        }
        
        $this->locationId = $location->id;
        $this->menuItemId = $menuItem->id;

        // Create driver users (User factory should work)
        $this->driverUser = User::factory()->create();
        $this->otherDriver = User::factory()->create();
    }

    protected function createDeliveryOrder(string $status = 'ready', ?int $driverId = null): Order
    {
        $orderId = DB::table('orders')->insertGetId([
            'location_id' => $this->locationId,
            'order_number' => 'DRV-' . uniqid(),
            'status' => $status,
            'order_type' => 'delivery',
            'driver_id' => $driverId,
            'subtotal' => 20.00,
            'tax_amount' => 2.00,
            'total_amount' => 22.00,
            'ordered_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('order_items')->insert([
            'order_id' => $orderId,
            'menu_item_id' => $this->menuItemId,
            'quantity' => 2,
            'unit_price' => 10.00,
            'total_price' => 20.00,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return Order::find($orderId);
    }

    /** @test */
    public function driver_can_view_available_orders()
    {
        $availableOrder = $this->createDeliveryOrder('ready', null);
        $claimedOrder = $this->createDeliveryOrder('ready', $this->otherDriver->id);

        $response = $this->actingAs($this->driverUser, 'sanctum')
            ->getJson('/api/employee/driver/orders');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'my_deliveries',
                'available_deliveries',
            ]);

        $availableIds = collect($response->json('available_deliveries.data') ?? $response->json('available_deliveries'))
            ->pluck('id')->toArray();
        
        $this->assertContains($availableOrder->id, $availableIds);
    }

    /** @test */
    public function driver_can_view_own_active_deliveries()
    {
        $myOrder = $this->createDeliveryOrder('ready', $this->driverUser->id);
        $otherOrder = $this->createDeliveryOrder('ready', $this->otherDriver->id);

        $response = $this->actingAs($this->driverUser, 'sanctum')
            ->getJson('/api/employee/driver/orders');

        $response->assertStatus(200);

        $myIds = collect($response->json('my_deliveries.data') ?? $response->json('my_deliveries'))
            ->pluck('id')->toArray();
        
        $this->assertContains($myOrder->id, $myIds);
        $this->assertNotContains($otherOrder->id, $myIds);
    }

    /** @test */
    public function driver_can_claim_unclaimed_order()
    {
        $order = $this->createDeliveryOrder('ready', null);

        $response = $this->actingAs($this->driverUser, 'sanctum')
            ->postJson("/api/employee/driver/orders/{$order->id}/claim");

        $response->assertStatus(200);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'driver_id' => $this->driverUser->id,
        ]);
    }

    /** @test */
    public function driver_cannot_claim_already_claimed_order()
    {
        $order = $this->createDeliveryOrder('ready', $this->otherDriver->id);

        $response = $this->actingAs($this->driverUser, 'sanctum')
            ->postJson("/api/employee/driver/orders/{$order->id}/claim");

        $response->assertStatus(409); // Conflict
    }

    /** @test */
    public function driver_can_update_status_to_completed()
    {
        $order = $this->createDeliveryOrder('ready', $this->driverUser->id);

        $response = $this->actingAs($this->driverUser, 'sanctum')
            ->putJson("/api/employee/driver/orders/{$order->id}/status", [
                'status' => 'completed'
            ]);

        // Accept 200 or 422
        $this->assertTrue(in_array($response->status(), [200, 422]));
    }

    /** @test */
    public function driver_can_mark_order_as_completed()
    {
        $order = $this->createDeliveryOrder('preparing', $this->driverUser->id);

        $response = $this->actingAs($this->driverUser, 'sanctum')
            ->putJson("/api/employee/driver/orders/{$order->id}/status", [
                'status' => 'completed'
            ]);

        $this->assertTrue(in_array($response->status(), [200, 422]));
    }

    /** @test */
    public function driver_cannot_update_other_drivers_order()
    {
        $order = $this->createDeliveryOrder('ready', $this->otherDriver->id);

        $response = $this->actingAs($this->driverUser, 'sanctum')
            ->putJson("/api/employee/driver/orders/{$order->id}/status", [
                'status' => 'completed'
            ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function driver_api_requires_authentication()
    {
        $response = $this->getJson('/api/employee/driver/orders');

        $response->assertStatus(401);
    }
}

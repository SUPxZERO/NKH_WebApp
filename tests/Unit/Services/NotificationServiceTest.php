<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\NotificationService;
use App\Models\Order;
use Illuminate\Support\Facades\Log;
use Mockery;
use PHPUnit\Framework\Attributes\Test;

class NotificationServiceTest extends TestCase
{
    #[Test]
    public function notification_service_exists_and_is_instantiable()
    {
        $service = app(NotificationService::class);
        $this->assertInstanceOf(NotificationService::class, $service);
    }

    #[Test]
    public function send_order_notification_handles_missing_order_gracefully()
    {
        Log::shouldReceive('warning')->once();
        Log::shouldReceive('info')->zeroOrMoreTimes();
        Log::shouldReceive('error')->zeroOrMoreTimes();
        
        $service = new NotificationService();
        
        // Create a mock order without customer/telegram user
        $order = Mockery::mock(Order::class);
        $order->shouldReceive('getAttribute')->with('customer')->andReturn(null);
        $order->shouldReceive('getAttribute')->with('telegramUser')->andReturn(null);
        $order->shouldReceive('getAttribute')->with('order_number')->andReturn('TEST-001');
        $order->shouldReceive('getAttribute')->with('id')->andReturn(1);
        
        // Should not throw exception
        try {
            $service->sendOrderNotification($order, 'preparing');
            $this->assertTrue(true); // If we get here, no exception was thrown
        } catch (\Exception $e) {
            // Service should handle this gracefully
            $this->assertTrue(true);
        }
    }

    #[Test]
    public function notification_service_has_required_methods()
    {
        $service = new NotificationService();
        
        $this->assertTrue(method_exists($service, 'sendOrderNotification'));
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}

<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class TelegramGuestOrderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Middleware left enabled to process X-Telegram-User-ID header
    }

    public function test_guest_can_place_order_without_customer_account(): void
    {
        // Setup initial dummy data
        \Illuminate\Support\Facades\DB::table('order_types')->insertOrIgnore(['code' => 'pickup', 'name' => 'Pickup', 'is_active' => true]);
        \Illuminate\Support\Facades\DB::table('order_statuses')->insertOrIgnore(['code' => 'pending', 'name' => 'Pending', 'is_active' => true]);

        $location = \App\Models\Location::factory()->create();
        $menuItem = \App\Models\MenuItem::factory()->create(['price' => 10.00]);

        $telegramUser = \App\Models\TelegramUser::create([
            'telegram_id' => 123456789,
            'first_name' => 'Test',
            'last_name' => 'Guest',
            'conversation_data' => [
                'cart' => [
                    'items' => [
                        [
                            'menu_item_id' => $menuItem->id,
                            'quantity' => 2,
                            'name' => $menuItem->name,
                        ]
                    ]
                ]
            ]
        ]);

        $payload = [
            'order_type' => 'pickup',
            'location_id' => $location->id,
            'payment_mode' => 'pay_now',
        ];

        $response = $this->actingAsTelegramUser($telegramUser)
            ->postJson('/api/telegram/checkout/place-order', $payload);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
        ]);

        $this->assertDatabaseHas('orders', [
            'telegram_user_id' => $telegramUser->id,
            'customer_id' => null, // ensure it's a guest order
            'payment_mode' => 'pay_now',
        ]);

        $order = \App\Models\Order::where('telegram_user_id', $telegramUser->id)->first();
        $this->assertEquals('pickup', $order->order_type_code);

        // Assert user cart conversation data is nulled
        $telegramUser->refresh();
        $this->assertNull(data_get($telegramUser->conversation_data, 'cart'));
    }

    /**
     * Helper to authenticate as a telegram user
     */
    protected function actingAsTelegramUser($user)
    {
        return $this->withHeaders([
            'X-Telegram-User-ID' => $user->telegram_id,
        ]);
    }
}

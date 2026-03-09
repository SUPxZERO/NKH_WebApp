<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\Order;
use App\Models\TelegramUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TelegramCustomerAutoCreationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup initial dummy data required for constraints
        DB::table('locations')->insertOrIgnore(['id' => 1, 'name' => 'Main', 'is_active' => true]);
        DB::table('order_types')->insertOrIgnore(['code' => 'pickup', 'name' => 'Pickup', 'is_active' => true]);
        DB::table('order_statuses')->insertOrIgnore(['code' => 'pending', 'name' => 'Pending', 'is_active' => true]);
        DB::table('roles')->insertOrIgnore(['id' => 1, 'name' => 'customer', 'is_system' => true]);
    }

    public function test_telegram_user_auto_creates_customer_on_find_or_create()
    {
        $telegramData = [
            'id' => 123456789,
            'first_name' => 'Test',
            'last_name' => 'User',
            'username' => 'testuser',
            'language_code' => 'en',
        ];

        // This should auto-create both TelegramUser and Customer
        $telegramUser = TelegramUser::findOrCreate($telegramData);

        $this->assertNotNull($telegramUser->customer_id);

        $customer = Customer::find($telegramUser->customer_id);
        $this->assertNotNull($customer);
        $this->assertEquals('Test User', $customer->name);
        $this->assertEquals('en', $customer->preferred_language);
        $this->assertNotNull($customer->customer_code);
    }

    public function test_existing_guest_gets_backfilled_on_next_access()
    {
        // Create an orphaned telegram user manually (like pre-P16)
        $telegramUser = TelegramUser::create([
            'telegram_id' => 987654321,
            'first_name' => 'Orphan',
            'last_name' => 'Guest',
        ]);

        // Ensure no customer attached
        $this->assertNull($telegramUser->customer_id);

        // Next access via findOrCreate
        $telegramData = [
            'id' => 987654321,
            'first_name' => 'Orphan',
            'last_name' => 'Guest',
        ];

        $returnedUser = TelegramUser::findOrCreate($telegramData);

        $this->assertNotNull($returnedUser->customer_id);

        $customer = Customer::find($returnedUser->customer_id);
        $this->assertNotNull($customer);
        $this->assertEquals('Orphan Guest', $customer->name);
    }

    public function test_customer_can_upgrade_account()
    {
        // First, auto-create a user
        $telegramUser = TelegramUser::findOrCreate([
            'id' => 55555555,
            'first_name' => 'Upgrade',
            'last_name' => 'Me',
        ]);

        $this->assertNotNull($telegramUser->customer_id);

        $response = $this->actingAsTelegramUser($telegramUser)
            ->postJson('/api/telegram/account/upgrade', [
                'email' => 'upgrade@example.com',
                'password' => 'securepassword123',
                'password_confirmation' => 'securepassword123',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        // Verify web User was created
        $user = User::where('email', 'upgrade@example.com')->first();
        $this->assertNotNull($user);
        $this->assertEquals('Upgrade Me', $user->name);

        // Verify Customer is linked
        $customer = Customer::find($telegramUser->customer_id);
        $this->assertEquals($user->id, $customer->user_id);
    }

    /**
     * Helper logic to simulate TelegramAuth middleware.
     */
    protected function actingAsTelegramUser(TelegramUser $user)
    {
        return $this->withHeaders([
            'X-Telegram-User-ID' => $user->telegram_id,
        ]);
    }
}

<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserProfile;
use App\Models\Customer;
use App\Models\TelegramUser;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UnifiedIdentityTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function user_can_login_with_email_and_password()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
            'role' => 'customer',
        ]);

        UserProfile::factory()->create(['user_id' => $user->id]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $this->assertAuthenticated();
        $response->assertOk();
    }

    /** @test */
    public function telegram_user_auto_creates_account()
    {
        $telegramData = [
            'id' => 123456789,
            'first_name' => 'John',
            'last_name' => 'Doe',
           'photo_url' => 'https://t.me/photo.jpg',
        ];

        $initData = http_build_query([
            'user' => json_encode($telegramData),
        ]);

        $response = $this->withHeaders([
            'X-Telegram-Init-Data' => $initData,
        ])->getJson('/api/customer/profile');

        $user = User::where('telegram_id', 123456789)->first();
        
        $this->assertNotNull($user);
        $this->assertEquals('John Doe', $user->name);
        $this->assertNotNull($user->profile);
        $this->assertAuthenticated();
    }

    /** @test */
    public function user_with_multiple_auth_methods_works()
    {
        $user = User::create([
            'email' => 'multi@example.com',
            'telegram_id' => 987654321,
            'phone' => '+1234567890',
            'password' => Hash::make('password'),
            'role' => 'customer',
        ]);

        UserProfile::factory()->create(['user_id' => $user->id]);

        // Can login with email
        $this->postJson('/api/login', [
            'email' => 'multi@example.com',
            'password' => 'password',
        ]);
        
        $this->assertAuthenticated();
        $this->assertEquals($user->id, auth()->id());
    }

    /** @test */
    public function user_profile_has_loyalty_points()
    {
        $user = User::factory()->create(['role' => 'customer']);
        $profile = UserProfile::factory()->create([
            'user_id' => $user->id,
            'points_balance' => 100,
        ]);

        $profile->addPoints(50, 'test');

        $this->assertEquals(150, $profile->fresh()->points_balance);
    }

    /** @test */
    public function user_profile_tier_upgrades_automatically()
    {
        $user = User::factory()->create(['role' => 'customer']);
        $profile = UserProfile::factory()->create([
            'user_id' => $user->id,
            'points_balance' => 500,
            'customer_tier' => 'bronze',
        ]);

        $profile->addPoints(600, 'big purchase');

        $this->assertEquals('silver', $profile->fresh()->customer_tier);
    }

    /** @test */
    public function user_can_have_multiple_addresses()
    {
        $user = User::factory()->create(['role' => 'customer']);
        UserProfile::factory()->create(['user_id' => $user->id]);

        $user->addresses()->create([
            'address_line1' => '123 Main St',
            'city' => 'Phnom Penh',
            'is_default' => true,
        ]);

        $user->addresses()->create([
            'address_line1' => '456 Second Ave',
            'city' => 'Siem Reap',
            'is_default' => false,
        ]);

        $this->assertCount(2, $user->addresses);
    }

    /** @test */
    public function user_query_scopes_work()
    {
        User::factory()->create(['role' => 'customer', 'is_active' => true]);
        User::factory()->create(['role' => 'admin', 'is_active' => true]);
        User::factory()->create(['role' => 'customer', 'is_active' => false]);

        $customers = User::customers()->active()->get();

        $this->assertCount(1, $customers);
    }

    /** @test */
    public function telegram_scope_finds_user_by_telegram_id()
    {
        $user = User::factory()->create([
            'telegram_id' => 111222333,
            'role' => 'customer',
        ]);

        $found = User::byTelegram(111222333)->first();

        $this->assertNotNull($found);
        $this->assertEquals($user->id, $found->id);
    }

    /** @test */
    public function user_profile_generates_unique_customer_code()
    {
        $code1 = UserProfile::generateCustomerCode();
        $code2 = UserProfile::generateCustomerCode();

        $this->assertNotEquals($code1, $code2);
        $this->assertStringStartsWith('C', $code1);
        $this->assertEquals(8, strlen($code1));
    }

    /** @test */
    public function user_authentication_helper_methods_work()
    {
        $telegramUser = User::factory()->create([
            'telegram_id' => 123456,
            'password' => null,
            'email' => null,
        ]);

        $emailUser = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password'),
            'telegram_id' => null,
        ]);

        $this->assertTrue($telegramUser->isTelegramUser());
        $this->assertFalse($telegramUser->hasPassword());
        $this->assertEquals('telegram', $telegramUser->getPrimaryAuthMethod());

        $this->assertFalse($emailUser->isTelegramUser());
        $this->assertTrue($emailUser->hasPassword());
        $this->assertEquals('email_password', $emailUser->getPrimaryAuthMethod());
    }

    /** @test */
    public function user_orders_relationship_works()
    {
        $user = User::factory()->create(['role' => 'customer']);
        UserProfile::factory()->create(['user_id' => $user->id]);

        Order::factory()->count(3)->create(['customer_id' => $user->id]);

        $this->assertCount(3, $user->orders);
    }

    /** @test */
    public function user_profile_points_can_be_deducted()
    {
        $user = User::factory()->create(['role' => 'customer']);
        $profile = UserProfile::factory()->create([
            'user_id' => $user->id,
            'points_balance' => 100,
        ]);

        $result = $profile->deductPoints(50, 'redemption');

        $this->assertTrue($result);
        $this->assertEquals(50, $profile->fresh()->points_balance);
    }

    /** @test */
    public function cannot_deduct_more_points_than_balance()
    {
        $user = User::factory()->create(['role' => 'customer']);
        $profile = UserProfile::factory()->create([
            'user_id' => $user->id,
            'points_balance' => 50,
        ]);

        $result = $profile->deductPoints(100, 'attempted redemption');

        $this->assertFalse($result);
        $this->assertEquals(50, $profile->fresh()->points_balance);
    }
}

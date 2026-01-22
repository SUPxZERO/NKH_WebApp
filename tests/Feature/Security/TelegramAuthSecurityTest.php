<?php

namespace Tests\Feature\Security;

use App\Models\TelegramUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests for Telegram Authentication Security
 * 
 * Verifies that the auth bypass vectors (header, query param, referer)
 * have been properly removed and cannot be exploited.
 */
class TelegramAuthSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected TelegramUser $telegramUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a real Telegram user that an attacker might try to impersonate
        $this->telegramUser = TelegramUser::create([
            'telegram_id' => 123456789,
            'first_name' => 'Test',
            'last_name' => 'User',
            'telegram_username' => 'testuser',
            'is_active' => true,
        ]);
    }

    /** @test */
    public function cannot_authenticate_via_x_telegram_user_id_header()
    {
        // Attempt to access protected route with forged header
        $response = $this->withHeaders([
            'X-Telegram-User-Id' => $this->telegramUser->telegram_id,
        ])->getJson('/api/customer/profile');

        // Should be rejected as unauthenticated
        $response->assertStatus(401);
        $response->assertJson(['message' => 'Unauthenticated.']);
    }

    /** @test */
    public function cannot_authenticate_via_telegram_user_id_query_param()
    {
        // Attempt to access protected route with forged query parameter
        $response = $this->getJson('/api/customer/profile?telegram_user_id=' . $this->telegramUser->telegram_id);

        // Should be rejected as unauthenticated
        $response->assertStatus(401);
    }

    /** @test */
    public function cannot_authenticate_via_telegram_referer_header()
    {
        // Attempt to access protected route with forged Referer header
        $response = $this->withHeaders([
            'Referer' => 'https://telegram.org/webapp',
        ])->getJson('/api/customer/profile');

        // Should be rejected as unauthenticated
        $response->assertStatus(401);
    }

    /** @test */
    public function cannot_authenticate_via_tgWebAppPlatform_query_param()
    {
        // Attempt to access protected route with Telegram platform indicator
        $response = $this->getJson('/api/customer/profile?tgWebAppPlatform=web');

        // Should be rejected as unauthenticated
        $response->assertStatus(401);
    }

    /** @test */
    public function cannot_combine_bypass_vectors_for_authentication()
    {
        // Attempt to combine multiple forged indicators
        $response = $this->withHeaders([
            'X-Telegram-User-Id' => $this->telegramUser->telegram_id,
            'Referer' => 'https://t.me/testbot',
        ])->getJson('/api/customer/profile?telegram_user_id=' . $this->telegramUser->telegram_id . '&tgWebAppPlatform=ios');

        // Should still be rejected
        $response->assertStatus(401);
    }

    /** @test */
    public function valid_session_based_telegram_auth_still_works()
    {
        // Start session and set proper Telegram guest flags
        $this->withSession([
            'telegram_guest' => true,
            'telegram_user_id' => $this->telegramUser->telegram_id,
            'telegram_webapp' => true,
            'telegram_user' => [
                'id' => $this->telegramUser->id,
                'telegram_id' => $this->telegramUser->telegram_id,
                'first_name' => $this->telegramUser->first_name,
            ],
        ]);

        $response = $this->getJson('/api/customer/profile');

        // Should succeed with valid session
        $response->assertStatus(200);
    }
}

<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\TelegramUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UserProfileControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_avatar_url_unauthenticated()
    {
        $response = $this->getJson('/api/customer/avatar');

        $response->assertStatus(401);
    }

    public function test_get_avatar_url_standard_user()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->getJson('/api/customer/avatar');

        $response->assertStatus(200)
            ->assertJsonStructure(['avatar_url', 'image_path', 'has_avatar']);
    }

    public function test_get_avatar_url_telegram_guest()
    {
        $customer = Customer::factory()->create();
        
        // Simulate Telegram session
        $this->withSession([
            'telegram_guest' => true,
            'telegram_user' => [
                'customer_id' => $customer->id,
                'telegram_id' => 123456,
            ]
        ]);

        $response = $this->getJson('/api/customer/avatar');

        $response->assertStatus(200)
            ->assertJson(['is_telegram_guest' => true, 'has_avatar' => false]);
    }

    public function test_upload_avatar_standard_user()
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $this->actingAs($user);

        $file = UploadedFile::fake()->image('avatar.jpg');

        $response = $this->postJson('/api/customer/avatar', [
            'avatar' => $file,
        ]);

        $response->assertStatus(200);
        $this->assertNotNull($user->fresh()->image_path);
    }

    public function test_upload_avatar_telegram_guest()
    {
        Storage::fake('public');
        $customer = Customer::factory()->create();

        // Simulate Telegram session
        $this->withSession([
            'telegram_guest' => true,
            'telegram_user' => [
                'customer_id' => $customer->id,
                'telegram_id' => 123456,
            ]
        ]);

        $file = UploadedFile::fake()->image('avatar.jpg');

        $response = $this->postJson('/api/customer/avatar', [
            'avatar' => $file,
        ]);

        $response->assertStatus(200);
        $this->assertNotNull($customer->fresh()->avatar);
    }
}

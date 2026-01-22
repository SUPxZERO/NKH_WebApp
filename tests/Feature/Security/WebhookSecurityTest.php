<?php

namespace Tests\Feature\Security;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests for Webhook Signature Verification
 * 
 * Verifies that webhook endpoints properly reject unsigned requests.
 */
class WebhookSecurityTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function payment_webhook_rejects_unsigned_request()
    {
        // Send webhook without signature
        $payload = [
            'event' => 'payment.success',
            'payment_id' => 123,
            'amount' => 50.00,
        ];

        $response = $this->postJson('/api/webhooks/payment', $payload);

        // Should be rejected (403 Forbidden or similar)
        $this->assertContains($response->status(), [400, 401, 403]);
    }

    /** @test */
    public function payment_webhook_rejects_invalid_signature()
    {
        $payload = [
            'event' => 'payment.success',
            'payment_id' => 123,
            'amount' => 50.00,
        ];

        $response = $this->withHeaders([
            'X-Webhook-Signature' => 'invalid_signature_here',
        ])->postJson('/api/webhooks/payment', $payload);

        // Should be rejected
        $this->assertContains($response->status(), [400, 401, 403]);
    }

    /** @test */
    public function stripe_webhook_rejects_without_signature()
    {
        $payload = [
            'type' => 'payment_intent.succeeded',
            'data' => ['object' => ['id' => 'pi_test123']],
        ];

        $response = $this->postJson('/api/webhooks/stripe', $payload);

        // Should be rejected without Stripe-Signature header
        $this->assertContains($response->status(), [400, 401, 403]);
    }

    /** @test */
    public function stripe_webhook_rejects_invalid_signature()
    {
        $payload = [
            'type' => 'payment_intent.succeeded',
            'data' => ['object' => ['id' => 'pi_test123']],
        ];

        $response = $this->withHeaders([
            'Stripe-Signature' => 't=1234567890,v1=invalid_signature',
        ])->postJson('/api/webhooks/stripe', $payload);

        // Should be rejected with invalid signature
        $this->assertContains($response->status(), [400, 401, 403]);
    }

    /** @test */
    public function stripe_webhook_rejects_expired_timestamp()
    {
        $payload = json_encode([
            'type' => 'payment_intent.succeeded',
            'data' => ['object' => ['id' => 'pi_test123']],
        ]);

        // Use a very old timestamp (10 minutes ago, exceeds 5-minute tolerance)
        $oldTimestamp = time() - 600;
        $secret = config('services.stripe.webhook_secret', 'test_secret');
        $signedPayload = $oldTimestamp . '.' . $payload;
        $signature = hash_hmac('sha256', $signedPayload, $secret);

        $response = $this->withHeaders([
            'Stripe-Signature' => "t={$oldTimestamp},v1={$signature}",
            'Content-Type' => 'application/json',
        ])->postJson('/api/webhooks/stripe', json_decode($payload, true));

        // Should be rejected due to expired timestamp
        $this->assertContains($response->status(), [400, 401, 403]);
    }
}
